import { Injectable, computed, effect, signal } from '@angular/core';
import {
  ClaveTraduccion,
  DICCIONARIOS,
  IDIOMAS,
  IDIOMA_POR_DEFECTO,
  Idioma,
  esIdiomaSoportado,
} from '../i18n/idiomas';

const CLAVE_ALMACEN = 'vau.idioma';

/**
 * Internacionalización basada en señales, sin dependencias externas.
 *
 * Las plantillas llaman a `t('seccion.clave')`; al leer la señal `idioma`
 * dentro de `t`, Angular vuelve a renderizar solo las vistas afectadas cuando
 * se cambia de idioma (funciona con `ChangeDetectionStrategy.OnPush`).
 */
@Injectable({ providedIn: 'root' })
export class I18nService {
  readonly idioma = signal<Idioma>(idiomaInicial());
  readonly idiomas = IDIOMAS;

  private readonly diccionario = computed(() => DICCIONARIOS[this.idioma()]);

  /** Locale BCP 47 del idioma activo, para `Intl`. */
  readonly locale = computed(
    () => IDIOMAS.find((i) => i.codigo === this.idioma())?.locale ?? 'es-ES',
  );

  constructor() {
    effect(() => {
      const idioma = this.idioma();
      document.documentElement.lang = idioma;
      try {
        localStorage.setItem(CLAVE_ALMACEN, idioma);
      } catch {
        /* almacenamiento no disponible: el idioma solo durará esta sesión */
      }
    });
  }

  /**
   * Traduce una clave con notación de puntos. Los parámetros sustituyen
   * marcadores del tipo `{nombre}`.
   */
  readonly t = (
    clave: ClaveTraduccion,
    params?: Readonly<Record<string, string | number>>,
  ): string => {
    const texto = clave
      .split('.')
      .reduce<unknown>(
        (nodo, parte) => (nodo as Record<string, unknown> | undefined)?.[parte],
        this.diccionario(),
      );

    if (typeof texto !== 'string') {
      return clave;
    }

    if (!params) {
      return texto;
    }

    return texto.replace(/\{(\w+)\}/g, (coincidencia, nombre: string) =>
      nombre in params ? String(params[nombre]) : coincidencia,
    );
  };

  cambiar(idioma: Idioma): void {
    this.idioma.set(idioma);
  }
}

function idiomaInicial(): Idioma {
  try {
    const guardado = localStorage.getItem(CLAVE_ALMACEN);
    if (esIdiomaSoportado(guardado)) {
      return guardado;
    }
  } catch {
    /* almacenamiento bloqueado */
  }

  const navegador = navigator.language?.slice(0, 2).toLowerCase() ?? '';
  return esIdiomaSoportado(navegador) ? navegador : IDIOMA_POR_DEFECTO;
}
