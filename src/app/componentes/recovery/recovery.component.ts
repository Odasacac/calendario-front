import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService, errorUsuario } from '../../servicios/auth.service';
import { I18nService } from '../../servicios/i18n.service';
import { NotificacionesService } from '../../servicios/notificaciones.service';
import { conIntentos, mensajeErrorComun } from '../../utiles/errores';
import {
  CONTRASENYA,
  CORREO_SOPORTE,
  EMAIL,
  coincidenValidator,
} from '../../utiles/validadores';
import { IconoComponent } from '../utiles/icono/icono.component';

/**
 * Recuperación en dos pasos: primero se comprueba que el código de usuario y
 * el correo son de la misma cuenta; el back devuelve un token de un solo uso
 * (10 min) con el que se fija la nueva contraseña.
 */
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
  private readonly auth = inject(AuthService);
  private readonly avisos = inject(NotificacionesService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly t = inject(I18nService).t;
  protected readonly correoSoporte = CORREO_SOPORTE;
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  protected readonly verContrasenya = signal(false);

  /** Token del paso 2; `null` mientras se está en el paso 1. */
  protected readonly token = signal<string | null>(null);
  protected readonly codigoVerificado = signal('');

  protected readonly datos = this.fb.group({
    codigoUsuario: ['', [Validators.required, Validators.maxLength(80)]],
    correo: ['', [Validators.required, Validators.pattern(EMAIL)]],
  });

  protected readonly nueva = this.fb.group(
    {
      contrasenya: ['', [Validators.required, Validators.pattern(CONTRASENYA)]],
      repetir: ['', Validators.required],
    },
    { validators: coincidenValidator('contrasenya', 'repetir') },
  );

  protected verificar(): void {
    if (this.datos.invalid) {
      this.datos.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }

    this.errorGeneral.set(null);
    this.enviando.set(true);

    const { codigoUsuario, correo } = this.datos.getRawValue();
    this.auth
      .verificarRecuperacion(codigoUsuario.trim(), correo.trim())
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: ({ token }) => {
          this.codigoVerificado.set(codigoUsuario.trim().toLowerCase());
          this.token.set(token);
        },
        error: (e: unknown) => {
          const error = errorUsuario(e);
          this.errorGeneral.set(
            error?.codigo === 'DATOS_RECUPERACION_INVALIDOS'
              ? conIntentos(this.t('recuperar.datosInvalidos'), error, this.t)
              : mensajeErrorComun(error, this.t),
          );
        },
      });
  }

  protected guardar(): void {
    const token = this.token();
    if (this.nueva.invalid || token === null) {
      this.nueva.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }

    this.errorGeneral.set(null);
    this.enviando.set(true);

    const { contrasenya, repetir } = this.nueva.getRawValue();
    this.auth
      .restablecerContrasenya(token, contrasenya, repetir)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: () => {
          this.avisos.exito(this.t('recuperar.exito'));
          void this.router.navigate(['/login']);
        },
        error: (e: unknown) => {
          const error = errorUsuario(e);
          if (error?.codigo === 'TOKEN_RECUPERACION_INVALIDO') {
            this.volverAlPaso1();
            this.errorGeneral.set(this.t('recuperar.tokenCaducado'));
          } else {
            this.errorGeneral.set(
              error?.codigo === 'CONTRASENYAS_NO_COINCIDEN'
                ? this.t('comun.contrasenyasNoCoinciden')
                : mensajeErrorComun(error, this.t),
            );
          }
        },
      });
  }

  /** Por ahora la petición no sale de la app: solo se confirma al usuario. */
  protected solicitarAyuda(): void {
    this.avisos.exito(this.t('recuperar.peticionEnviada'));
  }

  protected volverAlPaso1(): void {
    this.token.set(null);
    this.nueva.reset();
    this.errorGeneral.set(null);
  }

  protected volverAlLogin(): void {
    void this.router.navigate(['/login']);
  }

  protected invalidoDatos(campo: 'codigoUsuario' | 'correo'): boolean {
    const control = this.datos.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  protected errorDatos(campo: 'codigoUsuario' | 'correo'): string {
    return this.datos.controls[campo].hasError('required')
      ? this.t('comun.obligatorio')
      : campo === 'correo'
        ? this.t('comun.emailInvalido')
        : this.t('comun.campoMaximo', { max: 80 });
  }

  protected invalidoNueva(campo: 'contrasenya' | 'repetir'): boolean {
    const control = this.nueva.controls[campo];
    const tocado = control.touched || control.dirty;
    if (campo === 'repetir') {
      return tocado && (control.invalid || this.nueva.hasError('noCoinciden'));
    }
    return control.invalid && tocado;
  }

  protected errorNueva(campo: 'contrasenya' | 'repetir'): string {
    if (this.nueva.controls[campo].hasError('required')) {
      return this.t('comun.obligatorio');
    }
    return campo === 'contrasenya'
      ? this.t('comun.contrasenyaPolitica')
      : this.t('comun.contrasenyasNoCoinciden');
  }
}
