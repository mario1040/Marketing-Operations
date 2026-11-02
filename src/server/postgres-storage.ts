import fs from 'node:fs';
import path from 'node:path';
import { Pool } from 'pg';
import { StorageRepository, DatabaseSchema } from './storage';

/**
 * PostgreSQL-backed repository.
 *
 * The current domain model is intentionally stored as a single JSONB snapshot
 * while preserving the existing repository contract. Every mutation is queued
 * and committed to PostgreSQL; startup never overwrites an existing database.
 * This keeps legacy IDs and relationships intact during the first migration.
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
      CREATE TABLE IF NOT EXISTS marketing_app_state (
        id TEXT PRIMARY KEY CHECK (id = 'primary'),
        payload JSONB NOT NULL,
        revision BIGINT NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    this.initialized = true;
    const existing = await this.pool.query<{ payload: DatabaseSchema }>(
      "SELECT payload FROM marketing_app_state WHERE id = 'primary'"
    );

    if (existing.rowCount && existing.rows[0]) {
      this.setDatabase(existing.rows[0].payload);
      return;
    }

    const legacyPath = path.resolve(process.env.LEGACY_JSON_PATH || './data/marketing_db.json');
    let initial: DatabaseSchema;

    if (fs.existsSync(legacyPath)) {
      const raw = fs.readFileSync(legacyPath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { workspaces?: unknown }).workspaces)) {
        throw new Error('Legacy JSON database is invalid; refusing to seed PostgreSQL');
      }
      initial = this.migrateExistingData(parsed);
    } else {
      initial = this.getDefaultSchema();
    }

    this.setDatabase(initial);
    await this.persistSnapshot(initial);
    await this.flush();
  }

  protected save(data: DatabaseSchema): void {
    if (!this.initialized) {
      throw new Error('PostgreSQL repository is not initialized');
    }
    const snapshot = JSON.stringify(data);
    this.writeQueue = this.writeQueue
      .catch(() => undefined)
      .then(async () => {
        await this.pool.query(
          `INSERT INTO marketing_app_state (id, payload, revision, updated_at)
           VALUES ('primary', $1::jsonb, 1, NOW())
           ON CONFLICT (id) DO UPDATE
           SET payload = EXCLUDED.payload,
               revision = marketing_app_state.revision + 1,
               updated_at = NOW()`,
          [snapshot]
        );
        this.lastWriteError = null;
      })
      .catch(error => {
        this.lastWriteError = error;
        throw error;
      });
  }

  private async persistSnapshot(data: DatabaseSchema): Promise<void> {
    const snapshot = JSON.stringify(data);
    await this.pool.query(
      `INSERT INTO marketing_app_state (id, payload, revision, updated_at)
       VALUES ('primary', $1::jsonb, 1, NOW())
       ON CONFLICT (id) DO NOTHING`,
      [snapshot]
    );
  }


  /**
   * One-time import of the browser's pre-PostgreSQL cache. Browser records win
   * on matching IDs because that cache may contain the user's latest edits.
   * A migration marker makes repeated page loads safe and idempotent.
   */
  public async importBrowserCache(input: unknown): Promise<{ imported: boolean; counts?: Record<string, number> }> {
    if (!input || typeof input !== 'object') throw new Error('Invalid browser cache payload');
    const candidate = input as Partial<DatabaseSchema>;
    const keys: (keyof DatabaseSchema)[] = ['workspaces', 'brands', 'content', 'campaigns', 'team', 'activities'];
    for (const key of keys) {
      if (!Array.isArray(candidate[key])) throw new Error(`Invalid browser cache collection: ${key}`);
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const marker = await client.query(
        "SELECT name FROM marketing_app_migrations WHERE name = 'browser-cache-v1' FOR UPDATE"
      );
      if (marker.rowCount) {
        await client.query('COMMIT');
        return { imported: false };
      }

      const currentResult = await client.query<{ payload: DatabaseSchema }>(
        "SELECT payload FROM marketing_app_state WHERE id = 'primary' FOR UPDATE"
      );
      if (!currentResult.rowCount) throw new Error('PostgreSQL state has not been initialized');
      const current = currentResult.rows[0].payload;

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

      await client.query(
        "UPDATE marketing_app_state SET payload = $1::jsonb, revision = revision + 1, updated_at = NOW() WHERE id = 'primary'",
        [JSON.stringify(merged)]
      );
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
    if (this.lastWriteError) {
      throw this.lastWriteError;
    }
  }

  public async ping(): Promise<void> {
    await this.pool.query('SELECT 1');
  }

  public async close(): Promise<void> {
    await this.flush();
    await this.pool.end();
  }
}
