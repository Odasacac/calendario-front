import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export type NombreIcono =
  | 'sol'
  | 'luna'
  | 'globo'
  | 'izquierda'
  | 'derecha'
  | 'calendario'
  | 'descargar'
  | 'cerrar'
  | 'ok'
  | 'alerta'
  | 'info'
  | 'ojo'
  | 'ojo-cerrado'
  | 'imprimir'
  | 'copiar'
  | 'candado'
  | 'usuario'
  | 'salir'
  | 'menu'
  | 'estrella';

/** Trazos SVG de 24x24 dibujados con `currentColor`, sin fuentes de iconos. */
const TRAZOS: Record<NombreIcono, string> = {
  sol: 'M12 4V2m0 20v-2m8-8h2M2 12h2m13.66-5.66 1.41-1.41M4.93 19.07l1.41-1.41m0-11.32L4.93 4.93m14.14 14.14-1.41-1.41M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  luna: 'M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z',
  globo:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0 0c2.5-2.4 3.8-5.4 3.8-9S14.5 5.4 12 3m0 18c-2.5-2.4-3.8-5.4-3.8-9S9.5 5.4 12 3M3.5 9h17m-17 6h17',
  izquierda: 'M15 5l-7 7 7 7',
  derecha: 'M9 5l7 7-7 7',
  calendario:
    'M7 3v3m10-3v3M4 9h16M5 6h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z',
  descargar: 'M12 4v11m0 0 4-4m-4 4-4-4M5 19h14',
  cerrar: 'M6 6l12 12M18 6 6 18',
  ok: 'M5 13l4 4L19 7',
  alerta: 'M12 9v4m0 3v.5M12 3.5 2.5 20h19L12 3.5Z',
  info: 'M12 11v6m0-9.5V8M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  ojo: 'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12S18 18.5 12 18.5 2.5 12 2.5 12Zm12 0a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z',
  'ojo-cerrado':
    'M3 3l18 18M10.6 6c.46-.08.93-.12 1.4-.12 6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.3 3.1M6.3 8A17 17 0 0 0 2.5 12.4S6 18.9 12 18.9c1.2 0 2.3-.2 3.3-.6M9.9 9.9a2.5 2.5 0 0 0 3.4 3.6',
  imprimir:
    'M7 8V3h10v5M7 18H5a1 1 0 0 1-1-1v-6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1h-2M7 14h10v7H7v-7Z',
  copiar:
    'M9 9V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1h-4M5 9h9a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Z',
  candado:
    'M8 10V7a4 4 0 0 1 8 0v3m-9 0h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z',
  usuario: 'M4.5 20a7.5 7.5 0 0 1 15 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  salir: 'M15 4h3a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-3M10 8 6 12l4 4m-4-4h10',
  menu: 'M4 7h16M4 12h16M4 17h16',
  estrella: 'M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8-5.3-2.9-5.3 2.9 1.1-5.8-4.3-4.1 5.9-.8L12 3.5Z',
};

@Component({
  selector: 'app-icono',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="tamanyo()"
      [attr.height]="tamanyo()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path [attr.d]="trazo()" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
      line-height: 0;
    }
  `,
})
export class IconoComponent {
  readonly nombre = input.required<NombreIcono>();
  readonly tamanyo = input(20);

  readonly trazo = computed(() => TRAZOS[this.nombre()]);
}
