import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { I18nService } from '../../servicios/i18n.service';
import { NotificacionesService } from '../../servicios/notificaciones.service';
import { IconoComponent } from '../utiles/icono/icono.component';

const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

type CampoRegistro = 'nombre' | 'apellido' | 'correo' | 'fecha';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, IconoComponent],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroComponent {
  private readonly router = inject(Router);
  private readonly avisos = inject(NotificacionesService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly t = inject(I18nService).t;

  protected readonly formulario = this.fb.group({
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    correo: ['', [Validators.required, Validators.pattern(EMAIL)]],
    fecha: ['', Validators.required],
  });

  protected crearCuenta(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.avisos.info(this.t('registro.pendiente'));
  }

  protected volverAlLogin(): void {
    void this.router.navigate(['/login']);
  }

  protected invalido(campo: CampoRegistro): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  protected error(campo: CampoRegistro): string {
    const control = this.formulario.controls[campo];
    return control.hasError('required')
      ? this.t('comun.obligatorio')
      : this.t('comun.emailInvalido');
  }
}
