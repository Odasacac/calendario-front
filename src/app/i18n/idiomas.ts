import { Diccionario, es } from './es';
import { en } from './en';
import { ca } from './ca';

export type Idioma = 'es' | 'en' | 'ca';

export const IDIOMA_POR_DEFECTO: Idioma = 'es';

export const DICCIONARIOS: Record<Idioma, Diccionario> = { es, en, ca };

/** Metadatos para el selector de idioma de la cabecera. */
export const IDIOMAS: ReadonlyArray<{
  codigo: Idioma;
  etiqueta: string;
  locale: string;
}> = [
  { codigo: 'es', etiqueta: 'Español', locale: 'es-ES' },
  { codigo: 'en', etiqueta: 'English', locale: 'en-GB' },
  { codigo: 'ca', etiqueta: 'Català', locale: 'ca-ES' },
];

export function esIdiomaSoportado(valor: string | null): valor is Idioma {
  return valor === 'es' || valor === 'en' || valor === 'ca';
}

/**
 * Claves con notación de puntos derivadas del diccionario, p. ej.
 * `'vau.masDetalles'`. Da autocompletado y rompe la compilación si una clave
 * deja de existir.
 */
export type ClaveTraduccion = Hojas<Diccionario>;

type Hojas<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${Hojas<T[K]>}`;
}[keyof T & string];

export type { Diccionario };
