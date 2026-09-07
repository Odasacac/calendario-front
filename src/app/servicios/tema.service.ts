import { Injectable, effect, signal } from '@angular/core';

export type Tema = 'light' | 'dark';

const CLAVE_ALMACEN = 'vau.tema';

/**
 * Tema claro/oscuro. El valor efectivo se escribe en
 * `document.documentElement.dataset.theme`, que es lo que consumen los tokens
 * de `styles.css`. El primer valor lo calcula el script inline de
 * `index.html` para que no haya parpadeo al cargar.
 */
@Injectable({ providedIn: 'root' })
export class TemaService {
  /** `true` si el tema lo decide el sistema operativo (no hay elección guardada). */
  readonly sigueAlSistema = signal(!temaGuardado());
  readonly tema = signal<Tema>(temaInicial());

  constructor() {
    effect(() => {
      document.documentElement.dataset['theme'] = this.tema();
    });

    const consulta = window.matchMedia?.('(prefers-color-scheme: dark)');
    consulta?.addEventListener('change', (evento) => {
      if (this.sigueAlSistema()) {
        this.tema.set(evento.matches ? 'dark' : 'light');
      }
    });
  }

  alternar(): void {
    this.establecer(this.tema() === 'dark' ? 'light' : 'dark');
  }

  establecer(tema: Tema): void {
    this.tema.set(tema);
    this.sigueAlSistema.set(false);
    try {
      localStorage.setItem(CLAVE_ALMACEN, tema);
    } catch {
      /* almacenamiento no disponible: el tema solo durará esta sesión */
    }
  }

  /** Vuelve a delegar el tema en la preferencia del sistema. */
  seguirAlSistema(): void {
    this.sigueAlSistema.set(true);
    try {
      localStorage.removeItem(CLAVE_ALMACEN);
    } catch {
      /* almacenamiento no disponible */
    }
    this.tema.set(prefiereOscuro() ? 'dark' : 'light');
  }
}

function temaGuardado(): Tema | null {
  try {
    const valor = localStorage.getItem(CLAVE_ALMACEN);
    return valor === 'light' || valor === 'dark' ? valor : null;
  } catch {
    return null;
  }
}

function prefiereOscuro(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function temaInicial(): Tema {
  return temaGuardado() ?? (prefiereOscuro() ? 'dark' : 'light');
}
