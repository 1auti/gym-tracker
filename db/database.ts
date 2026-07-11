import * as SQLite from 'expo-sqlite';

const DB_NAME = 'gym-tracker.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Schema idempotente: sesiones (1) -> series (N), plus plantillas reutilizables.
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS sesiones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sesion_id INTEGER NOT NULL,
      ejercicio TEXT NOT NULL,
      peso REAL NOT NULL,
      repeticiones INTEGER NOT NULL,
      rpe REAL,
      rir INTEGER,
      orden INTEGER NOT NULL,
      FOREIGN KEY (sesion_id) REFERENCES sesiones(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS plantillas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS plantilla_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plantilla_id INTEGER NOT NULL,
      ejercicio TEXT NOT NULL,
      peso REAL,
      repeticiones INTEGER,
      rpe REAL,
      rir INTEGER,
      orden INTEGER NOT NULL,
      FOREIGN KEY (plantilla_id) REFERENCES plantillas(id) ON DELETE CASCADE
    );
  `);
}

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME).then(async (db) => {
      await runMigrations(db);
      return db;
    });
  }
  return dbPromise;
}

export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return dbPromise;
}
