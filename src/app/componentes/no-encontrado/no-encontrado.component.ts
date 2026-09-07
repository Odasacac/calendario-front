import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../../servicios/i18n.service';
import { IconoComponent } from '../utiles/icono/icono.component';

@Component({
  selector: 'app-no-encontrado',
  standalone: true,
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pagina-centrada">
      <section class="card tarjeta-auth text-center">
        <header>
          <span class="emblema" aria-hidden="true">
            <app-icono nombre="calendario" [tamanyo]="24" />
          </span>
          <p class="codigo">404</p>
          <h1>{{ t('noEncontrado.titulo') }}</h1>
          <p>{{ t('noEncontrado.mensaje') }}</p>
        </header>

        <button type="button" class="btn btn-primary btn-block" (click)="irAlInicio()">
          {{ t('noEncontrado.irAlInicio') }}
        </button>
      </section>
    </div>
  `,
  styles: `
    .codigo {
      font-size: var(--fs-3xl);
      font-weight: 700;
      line-height: 1;
      color: var(--primary);
    }
  `,
})
export class NoEncontradoComponent {
  private readonly router = inject(Router);
  protected readonly t = inject(I18nService).t;

  protected irAlInicio(): void {
    void this.router.navigate(['/login']);
  }
}
