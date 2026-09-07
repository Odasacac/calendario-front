import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { I18nService } from '../../servicios/i18n.service';
import { NotificacionesService } from '../../servicios/notificaciones.service';
import { IconoComponent } from '../utiles/icono/icono.component';

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

@Component({
  selector: 'app-recovery',
  standalone: true,
  imports: [ReactiveFormsModule, IconoComponent],
  templateUrl: './recovery.component.html',
  styleUrl: './recovery.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecoveryComponent {
  private readonly router = inject(Router);
  private readonly avisos = inject(NotificacionesService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly t = inject(I18nService).t;

  protected readonly formulario = this.fb.group({
    correo: ['', [Validators.required, Validators.pattern(EMAIL)]],
  });

  protected recuperar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.avisos.info(this.t('recuperar.pendiente'));
  }

  protected volverAlLogin(): void {
    void this.router.navigate(['/login']);
  }

  protected get invalido(): boolean {
    const control = this.formulario.controls.correo;
    return control.invalid && (control.touched || control.dirty);
  }

  protected get error(): string {
    return this.formulario.controls.correo.hasError('required')
      ? this.t('comun.obligatorio')
      : this.t('comun.emailInvalido');
  }
}
