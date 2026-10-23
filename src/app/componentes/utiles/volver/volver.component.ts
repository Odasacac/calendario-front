import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { I18nService } from '../../../servicios/i18n.service';
import { IconoComponent } from '../icono/icono.component';

/** Flecha «volver a la fecha VAU» que abre todas las secciones, siempre en el mismo sitio. */
@Component({
  selector: 'app-volver',
  standalone: true,
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="btn btn-ghost btn-icon"
      [attr.aria-label]="t('comun.volverAFechaVau')"
      [attr.title]="t('comun.volverAFechaVau')"
      (click)="volver.emit()"
    >
      <app-icono nombre="izquierda" [tamanyo]="22" />
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
      flex: none;
    }
  `,
})
export class VolverComponent {
  readonly volver = output<void>();

  protected readonly t = inject(I18nService).t;
}
