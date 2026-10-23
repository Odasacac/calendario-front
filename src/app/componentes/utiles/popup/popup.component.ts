import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
} from '@angular/core';
import { I18nService } from '../../../servicios/i18n.service';
import { IconoComponent, NombreIcono } from '../icono/icono.component';

let siguienteId = 0;

/**
 * Ventana modal con el estilo de la app. El contenido va en el hueco por
 * defecto y los botones en `[acciones]`.
 *
 * Si es `cerrable`, se cierra con Escape, con la X o pulsando fuera; si no,
 * solo con los botones que ponga quien la usa (y se anuncia como
 * `alertdialog`).
 */
@Component({
  selector: 'app-popup',
  standalone: true,
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fondo-popup" (click)="clickFondo($event)">
      <section
        class="card popup"
        [class.peligro]="tono() === 'peligro'"
        [attr.role]="cerrable() ? 'dialog' : 'alertdialog'"
        aria-modal="true"
        [attr.aria-labelledby]="idTitulo"
      >
        @if (cerrable()) {
          <button
            type="button"
            class="btn btn-ghost btn-icon cerrar"
            [attr.aria-label]="t('comun.cerrar')"
            (click)="cerrar.emit()"
          >
            <app-icono nombre="cerrar" [tamanyo]="18" />
          </button>
        }

        @if (icono(); as nombre) {
          <span class="emblema" [class.emblema-alerta]="tono() === 'peligro'" aria-hidden="true">
            <app-icono [nombre]="nombre" [tamanyo]="24" />
          </span>
        }
        <h2 [id]="idTitulo">{{ titulo() }}</h2>

        <div class="cuerpo">
          <ng-content />
        </div>

        <div class="acciones-popup">
          <ng-content select="[acciones]" />
        </div>
      </section>
    </div>
  `,
  styles: `
    .fondo-popup {
      position: fixed;
      inset: 0;
      z-index: 70;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--sp-4);
      background: var(--overlay);
      backdrop-filter: blur(3px);
      animation: aparecer 160ms ease-out;
    }

    .popup {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--sp-4);
      width: min(28rem, 100%);
      max-height: calc(100dvh - 2 * var(--sp-4));
      overflow-y: auto;
      padding: var(--sp-6);
      text-align: center;
      box-shadow: var(--shadow-3);
      animation: pop-in 240ms ease-out;
    }

    .popup.peligro {
      border-color: color-mix(in srgb, var(--danger) 40%, var(--border));
    }

    .cerrar {
      position: absolute;
      top: var(--sp-2);
      right: var(--sp-2);
    }

    .emblema {
      margin-bottom: 0;
    }

    h2 {
      font-size: var(--fs-xl);
    }

    .cuerpo {
      display: flex;
      flex-direction: column;
      gap: var(--sp-3);
      width: 100%;
      font-size: var(--fs-sm);
    }

    .acciones-popup {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--sp-2);
      width: 100%;
    }

    .acciones-popup:empty {
      display: none;
    }

    @keyframes aparecer {
      from {
        opacity: 0;
      }
    }

    @media (max-width: 30rem) {
      .popup {
        padding: var(--sp-5) var(--sp-4);
      }
    }
  `,
})
export class PopupComponent implements AfterViewInit {
  readonly titulo = input.required<string>();
  readonly icono = input<NombreIcono | null>(null);
  readonly tono = input<'normal' | 'peligro'>('normal');
  readonly cerrable = input(true);
  readonly cerrar = output<void>();

  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly t = inject(I18nService).t;
  protected readonly idTitulo = `popup-titulo-${siguienteId++}`;

  /** Lleva el foco al elemento marcado con `autofocus` o, si no hay, al primer campo o botón del contenido. */
  ngAfterViewInit(): void {
    setTimeout(() => {
      const raiz = this.elemento.nativeElement;
      const destino =
        raiz.querySelector<HTMLElement>('[autofocus]') ??
        raiz.querySelector<HTMLElement>('.cuerpo input, .cuerpo textarea, .acciones-popup button');
      destino?.focus();
    });
  }

  @HostListener('document:keydown.escape')
  protected escape(): void {
    if (this.cerrable()) {
      this.cerrar.emit();
    }
  }

  protected clickFondo(evento: MouseEvent): void {
    if (this.cerrable() && evento.target === evento.currentTarget) {
      this.cerrar.emit();
    }
  }
}
