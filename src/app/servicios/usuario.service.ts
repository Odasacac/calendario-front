import { Injectable, computed, effect, signal } from '@angular/core';
import { User } from '../interfaces/user';

interface SesionGuardada {
  readonly esInvitado: boolean;
  readonly usuario: User | null;
}

const CLAVE_ALMACEN = 'vau.sesion';

/**
 * Sesión del usuario.
 *
 * Se persiste en `sessionStorage` para que al recargar la página no se pierda
 * el acceso (antes, refrescar `/home` te echaba a `/forbidden`). Al cerrar la
 * pestaña la sesión desaparece.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly sesion = signal<SesionGuardada>(sesionInicial());

  readonly usuario = computed(() => this.sesion().usuario);
  readonly esInvitado = computed(() => this.sesion().esInvitado);
  readonly estaAutenticado = computed(
    () => this.sesion().usuario !== null || this.sesion().esInvitado,
  );

  constructor() {
    effect(() => {
      const sesion = this.sesion();
      try {
        if (sesion.usuario === null && !sesion.esInvitado) {
          sessionStorage.removeItem(CLAVE_ALMACEN);
        } else {
          sessionStorage.setItem(CLAVE_ALMACEN, JSON.stringify(sesion));
        }
      } catch {
        /* almacenamiento no disponible: la sesión vivirá solo en memoria */
      }
    });
  }

  getUsuario(): User | null {
    return this.sesion().usuario;
  }

  setUsuario(usuario: User | null): void {
    this.sesion.set({ usuario, esInvitado: false });
  }

  getEsInvitado(): boolean {
    return this.sesion().esInvitado;
  }

  setEsInvitado(esInvitado: boolean): void {
    this.sesion.set({ usuario: null, esInvitado });
  }

  cerrarSesion(): void {
    this.sesion.set({ usuario: null, esInvitado: false });
  }
}

function sesionInicial(): SesionGuardada {
  try {
    const guardada = sessionStorage.getItem(CLAVE_ALMACEN);
    if (guardada) {
      const datos = JSON.parse(guardada) as Partial<SesionGuardada>;
      return {
        esInvitado: datos.esInvitado === true,
        usuario: datos.usuario ?? null,
      };
    }
  } catch {
    /* dato corrupto o almacenamiento bloqueado */
  }

  return { esInvitado: false, usuario: null };
}
