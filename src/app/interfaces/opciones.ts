import { NombreIcono } from '../componentes/utiles/icono/icono.component';
import { ClaveTraduccion } from '../i18n/idiomas';

export type AccionOpcion = 'descargas' | 'eventos' | 'fecha-vau';

/** Entrada del menú «Más opciones» de la pantalla principal. */
export interface Opcion {
  readonly accion: AccionOpcion;
  readonly clave: ClaveTraduccion;
  readonly icono: NombreIcono;
  readonly soloRegistrados: boolean;
}
