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
export const FECHA_ACONTECIMIENTO_MIN = '1433-12-21';
export const FECHA_ACONTECIMIENTO_MAX = '2099-12-31';
export const DESCRIPCION_ACONTECIMIENTO_MAX = 1000;

/** Tamaños de página que ofrece la lista (el back admite de 5 a 50). */
export const TAMANYOS_PAGINA = [5, 10, 20, 50] as const;
export const TAMANYO_PAGINA_POR_DEFECTO = 10;

/** Página de resultados del back (`PaginaDTO`). `pagina` empieza en 0. */
export interface Pagina<T> {
  contenido: T[];
  pagina: number;
  tamanyo: number;
  totalElementos: number;
  totalPaginas: number;
}
