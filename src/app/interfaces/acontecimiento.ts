/** Acontecimiento destacado que el usuario apunta en un día del calendario (uno por día). */
export interface Acontecimiento {
  id: number;
  /** `yyyy-MM-dd` */
  fecha: string;
  descripcion: string;
  fechaCreacion: string;
  fechaModificacion: string;
  /** El back lo calcula al guardar: si ese día hay un evento reseñable del calendario y cuál. */
  notableEvent: boolean;
  notableEventType: string | null;
}

export interface DatosAcontecimiento {
  fecha: string;
  descripcion: string;
}

/** Mismo rango que acepta el back (`AcontecimientoDestacadoService`). */
export const FECHA_ACONTECIMIENTO_MIN = '0001-01-01';
export const FECHA_ACONTECIMIENTO_MAX = '2099-12-31';
export const DESCRIPCION_ACONTECIMIENTO_MAX = 1000;
