import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs';
import { I18nService } from '../../../servicios/i18n.service';
import { NotificacionesService } from '../../../servicios/notificaciones.service';
import {
  DownloadService,
  FicheroDescargado,
} from '../../../servicios/download.service';
import { IconoComponent } from '../icono/icono.component';

@Component({
  selector: 'app-descargas',
  standalone: true,
  imports: [ReactiveFormsModule, IconoComponent],
  templateUrl: './descargas.component.html',
  styleUrl: './descargas.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DescargasComponent {
  readonly back = output<void>();

  private readonly descargas = inject(DownloadService);
  private readonly avisos = inject(NotificacionesService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly t = inject(I18nService).t;
  protected readonly descargandoManual = signal(false);
  protected readonly descargandoCalendario = signal(false);

  protected readonly formulario = this.fb.group({
    yearOfEclipenoIN: [1, [Validators.required, Validators.min(0)]],
    numberOfMetonoIN: [1, [Validators.required, Validators.min(0)]],
    numberOfYear: [1, [Validators.required, Validators.min(0)]],
  });

  protected volver(): void {
    this.back.emit();
  }

  protected descargarManual(): void {
    if (this.descargandoManual()) {
      return;
    }

    this.descargandoManual.set(true);
    this.descargas
      .getPDF()
      .pipe(finalize(() => this.descargandoManual.set(false)))
      .subscribe({
        next: (fichero) => this.guardar(fichero),
        error: () => this.avisos.error(this.t('descargas.error')),
      });
  }

  protected descargarCalendario(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    if (this.descargandoCalendario()) {
      return;
    }

    this.descargandoCalendario.set(true);
    this.descargas
      .getCalendarForAYear(this.formulario.getRawValue())
      .pipe(finalize(() => this.descargandoCalendario.set(false)))
      .subscribe({
        next: (fichero) => this.guardar(fichero),
        error: () => this.avisos.error(this.t('descargas.error')),
      });
  }

  protected invalido(campo: keyof typeof this.formulario.controls): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  private guardar(fichero: FicheroDescargado): void {
    this.descargas.guardar(fichero);
    this.avisos.exito(this.t('descargas.exito', { fichero: fichero.nombre }));
  }
}
