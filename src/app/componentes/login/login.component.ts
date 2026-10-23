import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { ClaveTraduccion } from '../../i18n/idiomas';
import { MotivoSuspension, Sesion } from '../../interfaces/user';
import { AuthService, errorUsuario } from '../../servicios/auth.service';
import { I18nService } from '../../servicios/i18n.service';
import { NotificacionesService } from '../../servicios/notificaciones.service';
import { UsuarioService } from '../../servicios/usuario.service';
import { conIntentos, mensajeErrorComun } from '../../utiles/errores';
import { formatearFechaLarga } from '../../utiles/fechas';
import { CORREO_REACTIVACION } from '../../utiles/validadores';
import { IconoComponent } from '../utiles/icono/icono.component';

/** Situaciones que no son un simple error y piden un bloque propio en la tarjeta. */
type AvisoCuenta =
  | { readonly tipo: 'suspendida'; readonly motivo: MotivoSuspension | null }
  | { readonly tipo: 'eliminada'; readonly fecha: string };

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, IconoComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly usuarios = inject(UsuarioService);
  private readonly avisos = inject(NotificacionesService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;
  protected readonly correoReactivacion = CORREO_REACTIVACION;
  protected readonly verContrasenya = signal(false);
  protected readonly enviando = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly avisoCuenta = signal<AvisoCuenta | null>(null);

  protected readonly formulario = this.fb.group({
    user: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }

    this.error.set(null);
    this.avisoCuenta.set(null);
    this.enviando.set(true);

    const { user, password } = this.formulario.getRawValue();
    this.auth
      .login(user.trim(), password)
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (sesion) => this.entrar(sesion),
        error: (e: unknown) => this.mostrarError(e),
      });
  }

  protected entrarComoInvitado(): void {
    this.usuarios.setEsInvitado(true);
    this.avisos.exito(this.t('login.bienvenidaInvitado'));
    void this.router.navigate(['/home']);
  }

  /** Por ahora la petición no sale de la app: solo se confirma al usuario. */
  protected solicitarReactivacion(): void {
    this.avisos.exito(this.t('login.reactivacionEnviada'));
  }

  protected irA(ruta: string): void {
    void this.router.navigate([ruta]);
  }

  /** Se traduce en la plantilla para que siga el cambio de idioma. */
  protected motivoTexto(motivo: MotivoSuspension | null): string {
    return motivo ? this.t(`login.motivo${motivo}` as ClaveTraduccion) : '';
  }

  protected fechaTexto(iso: string): string {
    return formatearFechaLarga(iso, this.i18n.locale());
  }

  /** Muestra el error solo cuando el usuario ya ha interactuado con el campo. */
  protected invalido(campo: 'user' | 'password'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  private entrar(sesion: Sesion): void {
    this.usuarios.iniciarSesion(sesion);
    const nombre = sesion.usuario.nombre;
    this.avisos.exito(
      sesion.reactivada
        ? this.t('login.cuentaReactivada', { nombre })
        : this.t('login.bienvenida', { nombre }),
    );
    void this.router.navigate(['/home']);
  }

  private mostrarError(e: unknown): void {
    const error = errorUsuario(e);

    switch (error?.codigo) {
      case 'CREDENCIALES_INVALIDAS':
        this.error.set(conIntentos(this.t('login.credencialesInvalidas'), error, this.t));
        this.formulario.controls.password.reset();
        break;

      case 'CUENTA_SUSPENDIDA':
        this.avisoCuenta.set({
          tipo: 'suspendida',
          motivo: (error.detalles['motivo'] as MotivoSuspension | null) ?? null,
        });
        break;

      case 'CUENTA_ELIMINADA':
        this.avisoCuenta.set({
          tipo: 'eliminada',
          fecha: String(error.detalles['fechaEliminacion'] ?? ''),
        });
        break;

      default:
        this.error.set(mensajeErrorComun(error, this.t));
    }
  }
}
