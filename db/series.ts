import { getDatabase } from './database';
import { NuevaSerie, Serie } from './types';

export async function listSeriesBySesion(sesionId: number): Promise<Serie[]> {
  const db = await getDatabase();
  return db.getAllAsync<Serie>(
    'SELECT * FROM series WHERE sesion_id = ? ORDER BY orden ASC',
    [sesionId]
  );
}

export async function addSerie(sesionId: number, nueva: NuevaSerie): Promise<Serie> {
  const db = await getDatabase();
  const ultimoOrden = await db.getFirstAsync<{ maxOrden: number | null }>(
    'SELECT MAX(orden) AS maxOrden FROM series WHERE sesion_id = ?',
    [sesionId]
  );
  const orden = (ultimoOrden?.maxOrden ?? 0) + 1;
  const rpe = nueva.rpe ?? null;
  const rir = nueva.rir ?? null;

  const result = await db.runAsync(
    `INSERT INTO series (sesion_id, ejercicio, peso, repeticiones, rpe, rir, orden)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [sesionId, nueva.ejercicio, nueva.peso, nueva.repeticiones, rpe, rir, orden]
  );

  return {
    id: result.lastInsertRowId,
    sesion_id: sesionId,
    ejercicio: nueva.ejercicio,
    peso: nueva.peso,
    repeticiones: nueva.repeticiones,
    rpe,
    rir,
    orden,
  };
}

// Última serie cargada en la sesión, para el atajo "repetir última serie".
export async function getUltimaSerie(sesionId: number): Promise<Serie | null> {
  const db = await getDatabase();
  return db.getFirstAsync<Serie>(
    'SELECT * FROM series WHERE sesion_id = ? ORDER BY orden DESC LIMIT 1',
    [sesionId]
  );
}

export async function listEjerciciosConocidos(): Promise<string[]> {
  const db = await getDatabase();
  const filas = await db.getAllAsync<{ ejercicio: string }>(
    'SELECT DISTINCT ejercicio FROM series ORDER BY ejercicio ASC'
  );
  return filas.map((f) => f.ejercicio);
}

export interface SerieHistorial extends Serie {
  fecha: string;
}

// Últimas N series de un ejercicio a través de sesiones, para ver progreso.
export async function listSeriesPorEjercicio(
  ejercicio: string,
  limite = 50
): Promise<SerieHistorial[]> {
  const db = await getDatabase();
  return db.getAllAsync<SerieHistorial>(
    `SELECT se.*, s.fecha AS fecha
     FROM series se
     JOIN sesiones s ON s.id = se.sesion_id
     WHERE se.ejercicio = ?
     ORDER BY s.fecha DESC, se.orden DESC
     LIMIT ?`,
    [ejercicio, limite]
  );
}
