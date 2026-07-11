export interface Sesion {
  id: number;
  fecha: string; // ISO 8601 'YYYY-MM-DD'
}

export interface SesionResumen extends Sesion {
  totalSeries: number;
  totalEjercicios: number;
}

export interface Serie {
  id: number;
  sesion_id: number;
  ejercicio: string;
  peso: number;
  repeticiones: number;
  rpe: number | null;
  rir: number | null;
  orden: number;
}

export interface NuevaSerie {
  ejercicio: string;
  peso: number;
  repeticiones: number;
  rpe?: number | null;
  rir?: number | null;
}

export interface Plantilla {
  id: number;
  nombre: string;
}

export interface PlantillaItem {
  id: number;
  plantilla_id: number;
  ejercicio: string;
  peso: number | null;
  repeticiones: number | null;
  rpe: number | null;
  rir: number | null;
  orden: number;
}

export interface PlantillaConItems extends Plantilla {
  items: PlantillaItem[];
}

export interface NuevoPlantillaItem {
  ejercicio: string;
  peso?: number | null;
  repeticiones?: number | null;
  rpe?: number | null;
  rir?: number | null;
}
