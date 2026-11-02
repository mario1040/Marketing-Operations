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
