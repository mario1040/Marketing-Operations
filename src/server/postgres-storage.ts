import fs from 'node:fs';
import path from 'node:path';
import { Pool, type PoolClient } from 'pg';
import { StorageRepository, type DatabaseSchema } from './storage';

const COLLECTIONS = [
  { key: 'workspaces', table: 'marketing_workspaces' },
  { key: 'brands', table: 'marketing_brands' },
  { key: 'content', table: 'marketing_content' },
  { key: 'campaigns', table: 'marketing_campaigns' },
  { key: 'team', table: 'marketing_team_members' },
  { key: 'activities', table: 'marketing_activity_logs' },
] as const;

/**
 * PostgreSQL persistence adapter.
 *
 * Domain entities live in dedicated PostgreSQL tables with primary keys,
 * workspace indexes, stable row ordering, and JSONB payloads for flexible
 * domain fields. A transaction replaces the six collections atomically so
 * existing synchronous domain rules can be retained during this migration.
 */
export class PostgresStorageRepository extends StorageRepository {
  private readonly pool: Pool;
  private writeQueue: Promise<void> = Promise.resolve();
  private lastWriteError: unknown = null;
  private initialized = false;

  private constructor() {
    super(true);
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is required');
    this.pool = new Pool({
      connectionString,
      max: Number(process.env.DB_POOL_MAX || 10),
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    });
  }

  public static async connect(): Promise<PostgresStorageRepository> {
    const repository = new PostgresStorageRepository();
    await repository.initialize();
    return repository;
  }

  private async initialize(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_app_migrations (
        name TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        details JSONB NOT NULL DEFAULT '{}'::jsonb
      )
    `);
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS marketing_app_meta (
        id TEXT PRIMARY KEY CHECK (id = 'primary'),
        revision BIGINT NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    for (const collection of COLLECTIONS) {
      await this.pool.query(`
        CREATE TABLE IF NOT EXISTS ${collection.table} (
          id TEXT PRIMARY KEY,
          workspace_id TEXT,
          position INTEGER NOT NULL,
          payload JSONB NOT NULL
        )
      `);
      await this.pool.query(`CREATE INDEX IF NOT EXISTS ${collection.table}_workspace_idx ON ${collection.table} (workspace_id)`);
      await this.pool.query(`CREATE INDEX IF NOT EXISTS ${collection.table}_position_idx ON ${collection.table} (position)`);
    }

    const meta = await this.pool.query("SELECT revision FROM marketing_app_meta WHERE id = 'primary'");
    if (meta.rowCount) {
      this.setDatabase(await this.loadSnapshot(this.pool));
      this.initialized = true;
      return;
    }

    this.initialized = true;
    const legacyPath = path.resolve(process.env.LEGACY_JSON_PATH || './data/marketing_db.json');
    if (fs.existsSync(legacyPath)) {
      const raw = fs.readFileSync(legacyPath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { workspaces?: unknown }).workspaces)) {
        throw new Error('Legacy JSON database is invalid; refusing to seed PostgreSQL');
      }
      const migrated = this.migrateExistingData(parsed);
      this.setDatabase(migrated);
      await this.flush();
    } else {
      const initial = this.getDefaultSchema();
      this.setDatabase(initial);
      await this.persistSnapshot(initial);
    }
  }

  private async loadSnapshot(client: Pool | PoolClient): Promise<DatabaseSchema> {
    const result: Record<string, unknown[]> = {};
    for (const collection of COLLECTIONS) {
      const rows = await client.query<{ payload: unknown }>(
        `SELECT payload FROM ${collection.table} ORDER BY position ASC`
      );
      result[collection.key] = rows.rows.map(row => row.payload);
    }
    return result as unknown as DatabaseSchema;
  }

  private async writeSnapshot(client: PoolClient, data: DatabaseSchema): Promise<void> {
    for (const collection of COLLECTIONS) {
      await client.query(`DELETE FROM ${collection.table}`);
      const records = data[collection.key] as unknown as Array<Record<string, unknown>>;
      if (records.length) {
        await client.query(
          `INSERT INTO ${collection.table} (id, workspace_id, position, payload)
           SELECT item->>'id',
                  NULLIF(item->>'workspaceId', ''),
                  ordinality::INTEGER,
                  item
           FROM jsonb_array_elements($1::jsonb) WITH ORDINALITY AS source(item, ordinality)`,
          [JSON.stringify(records)]
        );
      }
    }
    await client.query(`
      INSERT INTO marketing_app_meta (id, revision, updated_at)
      VALUES ('primary', 1, NOW())
      ON CONFLICT (id) DO UPDATE
      SET revision = marketing_app_meta.revision + 1, updated_at = NOW()
    `);
  }

  private async persistSnapshot(data: DatabaseSchema): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await this.writeSnapshot(client, data);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  protected save(data: DatabaseSchema): void {
    if (!this.initialized) throw new Error('PostgreSQL repository is not initialized');
    const snapshot = JSON.parse(JSON.stringify(data)) as DatabaseSchema;
    this.writeQueue = this.writeQueue
      .catch(() => undefined)
      .then(() => this.persistSnapshot(snapshot))
      .then(() => { this.lastWriteError = null; })
      .catch(error => {
        this.lastWriteError = error;
        throw error;
      });
  }

  /**
   * One-time import of the browser's pre-PostgreSQL cache. Browser records win
   * on matching IDs because that cache may contain the user's latest edits.
   * The migration marker makes repeated page loads safe and idempotent.
   */
  public async importBrowserCache(input: unknown): Promise<{ imported: boolean; counts?: Record<string, number> }> {
    if (!input || typeof input !== 'object') throw new Error('Invalid browser cache payload');
    const candidate = input as Partial<DatabaseSchema>;
    const keys = COLLECTIONS.map(collection => collection.key);
    for (const key of keys) {
      if (!Array.isArray(candidate[key])) throw new Error(`Invalid browser cache collection: ${key}`);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('SELECT pg_advisory_xact_lock(714202611)');
      const marker = await client.query(
        "SELECT name FROM marketing_app_migrations WHERE name = 'browser-cache-v1'"
      );
      if (marker.rowCount) {
        await client.query('COMMIT');
        return { imported: false };
      }

      const current = this.db;
      const merged = {} as DatabaseSchema;
      const counts: Record<string, number> = {};
      for (const key of keys) {
        const byId = new Map<string, Record<string, unknown>>();
        for (const record of current[key] as unknown as Record<string, unknown>[]) {
          if (typeof record?.id === 'string') byId.set(record.id, record);
        }
        for (const record of candidate[key] as unknown as Record<string, unknown>[]) {
          if (typeof record?.id === 'string') byId.set(record.id, record);
        }
        (merged[key] as unknown as Record<string, unknown>[]) = Array.from(byId.values());
        counts[key] = merged[key].length;
      }

      await this.writeSnapshot(client, merged);
      await client.query(
        "INSERT INTO marketing_app_migrations (name, details) VALUES ('browser-cache-v1', $1::jsonb)",
        [JSON.stringify({ counts })]
      );
      await client.query('COMMIT');
      this.setDatabase(merged);
      return { imported: true, counts };
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  public async flush(): Promise<void> {
    await this.writeQueue;
    if (this.lastWriteError) throw this.lastWriteError;
  }

  public async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  public async close(): Promise<void> {
    await this.flush();
    await this.pool.end();
  }
}
