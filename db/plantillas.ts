import { getDatabase } from './database';
import { NuevoPlantillaItem, Plantilla, PlantillaConItems, PlantillaItem } from './types';

export async function listPlantillas(): Promise<Plantilla[]> {
  const db = await getDatabase();
  return db.getAllAsync<Plantilla>('SELECT id, nombre FROM plantillas ORDER BY nombre ASC');
}

export async function getPlantilla(id: number): Promise<PlantillaConItems | null> {
  const db = await getDatabase();
  const plantilla = await db.getFirstAsync<Plantilla>(
    'SELECT id, nombre FROM plantillas WHERE id = ?',
    [id]
  );
  if (!plantilla) return null;

  const items = await db.getAllAsync<PlantillaItem>(
    'SELECT * FROM plantilla_items WHERE plantilla_id = ? ORDER BY orden ASC',
    [id]
  );
  return { ...plantilla, items };
}

export async function crearPlantilla(
  nombre: string,
  items: NuevoPlantillaItem[]
): Promise<number> {
  const db = await getDatabase();
  const result = await db.runAsync('INSERT INTO plantillas (nombre) VALUES (?)', [nombre]);
  const plantillaId = result.lastInsertRowId;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await db.runAsync(
      `INSERT INTO plantilla_items (plantilla_id, ejercicio, peso, repeticiones, rpe, rir, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        plantillaId,
        item.ejercicio,
        item.peso ?? null,
        item.repeticiones ?? null,
        item.rpe ?? null,
        item.rir ?? null,
        i + 1,
      ]
    );
  }

  return plantillaId;
}

// Reemplaza nombre e items completos (edición vía "borrar y recrear" items para simplicidad).
export async function actualizarPlantilla(
  id: number,
  nombre: string,
  items: NuevoPlantillaItem[]
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE plantillas SET nombre = ? WHERE id = ?', [nombre, id]);
  await db.runAsync('DELETE FROM plantilla_items WHERE plantilla_id = ?', [id]);

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    await db.runAsync(
      `INSERT INTO plantilla_items (plantilla_id, ejercicio, peso, repeticiones, rpe, rir, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        item.ejercicio,
        item.peso ?? null,
        item.repeticiones ?? null,
        item.rpe ?? null,
        item.rir ?? null,
        i + 1,
      ]
    );
  }
}

export async function eliminarPlantilla(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM plantillas WHERE id = ?', [id]);
}
