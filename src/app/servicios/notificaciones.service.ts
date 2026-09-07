import { Injectable, signal } from '@angular/core';

export type TipoNotificacion = 'exito' | 'error' | 'info';

export interface Notificacion {
  readonly id: number;
  readonly tipo: TipoNotificacion;
  readonly mensaje: string;
}

const DURACION_MS = 5000;

/** Avisos efímeros (toasts) mostrados por `NotificacionesComponent`. */
@Injectable({ providedIn: 'root' })
export class NotificacionesService {
  readonly notificaciones = signal<readonly Notificacion[]>([]);

  private siguienteId = 0;
  private readonly temporizadores = new Map<number, ReturnType<typeof setTimeout>>();

  exito(mensaje: string): void {
    this.mostrar('exito', mensaje);
  }

  error(mensaje: string): void {
    this.mostrar('error', mensaje);
  }

  info(mensaje: string): void {
    this.mostrar('info', mensaje);
  }

  mostrar(tipo: TipoNotificacion, mensaje: string, duracionMs = DURACION_MS): void {
    const id = this.siguienteId++;
    this.notificaciones.update((actuales) => [...actuales, { id, tipo, mensaje }]);
    this.temporizadores.set(
      id,
      setTimeout(() => this.cerrar(id), duracionMs),
    );
  }

  cerrar(id: number): void {
    const temporizador = this.temporizadores.get(id);
    if (temporizador !== undefined) {
      clearTimeout(temporizador);
      this.temporizadores.delete(id);
    }
    this.notificaciones.update((actuales) => actuales.filter((n) => n.id !== id));
  }
}
