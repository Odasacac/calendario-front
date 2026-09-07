import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { I18nService } from '../../../servicios/i18n.service';
import { NotificacionesService } from '../../../servicios/notificaciones.service';
import { IconoComponent, NombreIcono } from '../icono/icono.component';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pila no-print" role="status" aria-live="polite">
      @for (aviso of notificaciones.notificaciones(); track aviso.id) {
        <div class="aviso" [class]="'aviso-' + aviso.tipo">
          <app-icono [nombre]="icono(aviso.tipo)" />
          <span class="texto">{{ aviso.mensaje }}</span>
          <button
            type="button"
            class="cerrar"
            [attr.aria-label]="t('comun.cerrar')"
            (click)="notificaciones.cerrar(aviso.id)"
          >
            <app-icono nombre="cerrar" [tamanyo]="16" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .pila {
      position: fixed;
      z-index: 60;
      right: var(--sp-4);
      bottom: var(--sp-4);
      display: flex;
      flex-direction: column;
      gap: var(--sp-2);
      width: min(24rem, calc(100vw - 2 * var(--sp-4)));
      pointer-events: none;
    }

    .aviso {
      display: flex;
      align-items: center;
      gap: var(--sp-3);
      padding: var(--sp-3) var(--sp-3) var(--sp-3) var(--sp-4);
      border: 1px solid var(--border);
      border-left: 4px solid var(--info);
      border-radius: var(--radius-md);
      background: var(--surface);
      box-shadow: var(--shadow-3);
      pointer-events: auto;
      animation: pop-in 200ms ease-out;
    }

    .aviso-exito {
      border-left-color: var(--success);
      color: var(--text);
    }

    .aviso-exito app-icono {
      color: var(--success);
    }

    .aviso-error {
      border-left-color: var(--danger);
    }

    .aviso-error app-icono {
      color: var(--danger);
    }

    .aviso-info app-icono {
      color: var(--info);
    }

    .texto {
      flex: 1;
      font-size: var(--fs-sm);
      font-weight: 500;
    }

    .cerrar {
      display: inline-flex;
      padding: var(--sp-1);
      border: 0;
      border-radius: var(--radius-sm);
      background: none;
      color: var(--text-subtle);
      cursor: pointer;
    }

    .cerrar:hover {
      color: var(--text);
      background: var(--surface-3);
    }

    @media (max-width: 40rem) {
      .pila {
        right: var(--sp-3);
        left: var(--sp-3);
        bottom: var(--sp-3);
        width: auto;
      }
    }
  `,
})
export class NotificacionesComponent {
  protected readonly notificaciones = inject(NotificacionesService);
  protected readonly t = inject(I18nService).t;

  protected icono(tipo: 'exito' | 'error' | 'info'): NombreIcono {
    switch (tipo) {
      case 'exito':
        return 'ok';
      case 'error':
        return 'alerta';
      default:
        return 'info';
    }
  }
}
