import { getDatabase } from './database';
import { Sesion, SesionResumen } from './types';

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

// Devuelve la sesión de hoy, creándola si todavía no existe.
export async function getOrCrearSesionHoy(): Promise<Sesion> {
  const db = await getDatabase();
  const fecha = hoyISO();
  const existente = await db.getFirstAsync<Sesion>(
    'SELECT id, fecha FROM sesiones WHERE fecha = ?',
    [fecha]
  );
  if (existente) return existente;

  const result = await db.runAsync('INSERT INTO sesiones (fecha) VALUES (?)', [fecha]);
  return { id: result.lastInsertRowId, fecha };
}

export async function listSesiones(): Promise<SesionResumen[]> {
  const db = await getDatabase();
  return db.getAllAsync<SesionResumen>(`
    SELECT
      s.id,
      s.fecha,
      COUNT(se.id) AS totalSeries,
      COUNT(DISTINCT se.ejercicio) AS totalEjercicios
    FROM sesiones s
    LEFT JOIN series se ON se.sesion_id = s.id
    GROUP BY s.id
    ORDER BY s.fecha DESC, s.id DESC
  `);
}

export async function getSesion(id: number): Promise<Sesion | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Sesion>('SELECT id, fecha FROM sesiones WHERE id = ?', [id]);
}
