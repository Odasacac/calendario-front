import { Injectable, computed, effect, signal } from '@angular/core';
import { Sesion, User } from '../interfaces/user';

interface SesionGuardada {
  readonly esInvitado: boolean;
  readonly usuario: User | null;
  readonly token: string | null;
  /** Instante ISO en el que caduca el token. */
  readonly expiraEn: string | null;
}

const CLAVE_ALMACEN = 'vau.sesion';
const SIN_SESION: SesionGuardada = { esInvitado: false, usuario: null, token: null, expiraEn: null };

/**
 * Sesión del usuario.
 *
 * Se persiste en `sessionStorage` para que al recargar la página no se pierda
 * el acceso (antes, refrescar `/home` te echaba a `/forbidden`). Al cerrar la
 * pestaña la sesión desaparece. Para usuarios registrados guarda también el
 * JWT; una sesión caducada no se restaura.
 */
@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly sesion = signal<SesionGuardada>(sesionInicial());

  readonly usuario = computed(() => this.sesion().usuario);
  readonly esInvitado = computed(() => this.sesion().esInvitado);
  readonly esRegistrado = computed(() => this.sesion().usuario !== null);
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

  /** Token vigente, o `null` si no hay o ya ha caducado (en cuyo caso cierra la sesión). */
  getToken(): string | null {
    const { token, expiraEn } = this.sesion();
    if (token && haCaducado(expiraEn)) {
      this.cerrarSesion();
      return null;
    }
    return token;
  }

  iniciarSesion(sesion: Sesion): void {
    this.sesion.set({
      esInvitado: false,
      usuario: sesion.usuario,
      token: sesion.token,
      expiraEn: sesion.expiraEn,
    });
  }

  /** Refresca los datos del perfil sin tocar el token. */
  actualizarUsuario(usuario: User): void {
    this.sesion.update((actual) => (actual.token ? { ...actual, usuario } : actual));
  }

  getEsInvitado(): boolean {
    return this.sesion().esInvitado;
  }

  setEsInvitado(esInvitado: boolean): void {
    this.sesion.set({ ...SIN_SESION, esInvitado });
  }

  cerrarSesion(): void {
    this.sesion.set(SIN_SESION);
  }
}

function haCaducado(expiraEn: string | null): boolean {
  return expiraEn === null || Date.parse(expiraEn) <= Date.now();
}

function sesionInicial(): SesionGuardada {
  try {
    const guardada = sessionStorage.getItem(CLAVE_ALMACEN);
    if (guardada) {
      const datos = JSON.parse(guardada) as Partial<SesionGuardada>;
      if (datos.esInvitado === true) {
        return { ...SIN_SESION, esInvitado: true };
      }
      if (datos.usuario && datos.token && !haCaducado(datos.expiraEn ?? null)) {
        return {
          esInvitado: false,
          usuario: datos.usuario,
          token: datos.token,
          expiraEn: datos.expiraEn ?? null,
        };
      }
    }
  } catch {
    /* dato corrupto o almacenamiento bloqueado */
  }

  return SIN_SESION;
}
