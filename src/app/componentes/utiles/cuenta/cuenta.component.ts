import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  output,
  signal,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable, finalize } from 'rxjs';
import { User } from '../../../interfaces/user';
import { AuthService, errorUsuario } from '../../../servicios/auth.service';
import { I18nService } from '../../../servicios/i18n.service';
import { NotificacionesService } from '../../../servicios/notificaciones.service';
import { UsuarioService } from '../../../servicios/usuario.service';
import { conIntentos, mensajeErrorComun } from '../../../utiles/errores';
import { formatearFechaLarga } from '../../../utiles/fechas';
import {
  CONTRASENYA,
  coincidenValidator,
  fechaNacimientoValidator,
} from '../../../utiles/validadores';
import { IconoComponent } from '../icono/icono.component';
import { VolverComponent } from '../volver/volver.component';

/** Bloque de la pantalla que está abierto para editar o confirmar. */
type Panel = 'perfil' | 'contrasenya' | 'suspender' | 'eliminar' | null;

/**
 * «Mi cuenta»: datos del usuario, edición del perfil, cambio de contraseña,
 * acceso a acontecimientos destacados y suspensión / eliminación de la cuenta.
 * Solo se muestra a usuarios registrados (lo filtra `HomeComponent`).
 */
@Component({
  selector: 'app-cuenta',
  standalone: true,
  imports: [ReactiveFormsModule, IconoComponent, VolverComponent],
  templateUrl: './cuenta.component.html',
  styleUrl: './cuenta.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CuentaComponent implements OnInit {
  readonly back = output<void>();
  readonly acontecimientos = output<void>();

  private readonly auth = inject(AuthService);
  private readonly usuarios = inject(UsuarioService);
  private readonly avisos = inject(NotificacionesService);
  private readonly router = inject(Router);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;
  protected readonly usuario = this.usuarios.usuario;
  protected readonly panel = signal<Panel>(null);
  protected readonly enviando = signal(false);
  protected readonly errorPanel = signal<string | null>(null);

  protected readonly inicial = computed(() =>
    (this.usuario()?.nombre ?? '').trim().charAt(0).toUpperCase(),
  );

  protected readonly perfil = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(60)]],
    apellido: ['', [Validators.required, Validators.maxLength(60)]],
    fechaNacimiento: ['', [Validators.required, fechaNacimientoValidator]],
  });

  protected readonly contrasenya = this.fb.group(
    {
      actual: ['', Validators.required],
      nueva: ['', [Validators.required, Validators.pattern(CONTRASENYA)]],
      repetir: ['', Validators.required],
    },
    { validators: coincidenValidator('nueva', 'repetir') },
  );

  protected readonly eliminacion = this.fb.group({
    contrasenya: ['', Validators.required],
  });

  /** Refresca el perfil al entrar: puede haber cambiado desde el login. */
  ngOnInit(): void {
    this.auth.perfil().subscribe({
      next: (usuario) => this.usuarios.actualizarUsuario(usuario),
      error: () => {
        /* un 401 ya lo gestiona el interceptor; con el resto basta lo que hay en sesión */
      },
    });
  }

  protected fecha(iso: string | null | undefined): string {
    return iso ? formatearFechaLarga(iso.slice(0, 10), this.i18n.locale()) : '—';
  }

  protected abrir(panel: Panel): void {
    this.errorPanel.set(null);
    this.panel.set(this.panel() === panel ? null : panel);

    const usuario = this.usuario();
    if (this.panel() === 'perfil' && usuario) {
      this.perfil.reset({
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        fechaNacimiento: usuario.fechaNacimiento,
      });
    }
    if (this.panel() === 'contrasenya') {
      this.contrasenya.reset();
    }
    if (this.panel() === 'eliminar') {
      this.eliminacion.reset();
    }
  }

  protected guardarPerfil(): void {
    if (!this.validar(this.perfil)) {
      return;
    }

    const codigoAnterior = this.usuario()?.codigoUsuario;
    const datos = this.perfil.getRawValue();
    this.enviar(
      this.auth.editarPerfil({
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        fechaNacimiento: datos.fechaNacimiento,
      }),
      (usuario: User) => {
        this.usuarios.actualizarUsuario(usuario);
        this.avisos.exito(
          usuario.codigoUsuario !== codigoAnterior
            ? this.t('cuenta.codigoCambiado', { codigo: usuario.codigoUsuario })
            : this.t('cuenta.perfilGuardado'),
        );
        this.panel.set(null);
      },
    );
  }

  protected cambiarContrasenya(): void {
    if (!this.validar(this.contrasenya)) {
      return;
    }

    const { actual, nueva } = this.contrasenya.getRawValue();
    this.enviar(this.auth.cambiarContrasenya(actual, nueva), () => {
      this.avisos.exito(this.t('cuenta.contrasenyaCambiada'));
      this.panel.set(null);
    });
  }

  protected suspender(): void {
    this.enviar(this.auth.suspenderCuenta(), () => this.salir(this.t('cuenta.suspendida')));
  }

  protected eliminar(): void {
    if (!this.validar(this.eliminacion)) {
      return;
    }

    this.enviar(this.auth.eliminarCuenta(this.eliminacion.getRawValue().contrasenya), () =>
      this.salir(this.t('cuenta.eliminada')),
    );
  }

  /** Por ahora la petición no sale de la app: solo se confirma al usuario. */
  protected solicitarCambioCorreo(): void {
    this.avisos.exito(this.t('cuenta.cambioCorreoEnviado'));
  }

  protected invalido(control: { invalid: boolean; touched: boolean; dirty: boolean }): boolean {
    return control.invalid && (control.touched || control.dirty);
  }

  protected repeticionInvalida(): boolean {
    const control = this.contrasenya.controls.repetir;
    return (
      (control.touched || control.dirty) &&
      (control.invalid || this.contrasenya.hasError('noCoinciden'))
    );
  }

  private validar(formulario: { invalid: boolean; markAllAsTouched(): void }): boolean {
    if (formulario.invalid) {
      formulario.markAllAsTouched();
      return false;
    }
    return !this.enviando();
  }

  private enviar<T>(peticion: Observable<T>, alTerminar: (respuesta: T) => void): void {
    this.errorPanel.set(null);
    this.enviando.set(true);
    peticion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: alTerminar,
      error: (e: unknown) => this.mostrarError(e),
    });
  }

  private mostrarError(e: unknown): void {
    const error = errorUsuario(e);
    switch (error?.codigo) {
      case 'SESION_NO_VALIDA':
        // El interceptor ya ha cerrado la sesión y vuelto al login.
        return;
      case 'CONTRASENYA_ACTUAL_INCORRECTA':
        this.errorPanel.set(conIntentos(this.t('cuenta.contrasenyaIncorrecta'), error, this.t));
        return;
      case 'CONTRASENYA_REPETIDA':
        this.errorPanel.set(this.t('cuenta.contrasenyaRepetida'));
        return;
      case 'FECHA_NACIMIENTO_INVALIDA':
        this.errorPanel.set(this.t('comun.fechaInvalida'));
        return;
      default:
        this.errorPanel.set(mensajeErrorComun(error, this.t));
    }
  }

  private salir(mensaje: string): void {
    this.usuarios.cerrarSesion();
    this.avisos.info(mensaje);
    void this.router.navigate(['/login']);
  }
}
