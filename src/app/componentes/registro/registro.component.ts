import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Sesion, User } from '../../interfaces/user';
import { AuthService, errorUsuario } from '../../servicios/auth.service';
import { I18nService } from '../../servicios/i18n.service';
import { UsuarioService } from '../../servicios/usuario.service';
import { mensajeErrorComun } from '../../utiles/errores';
import {
  CONTRASENYA,
  EMAIL,
  coincidenValidator,
  fechaNacimientoValidator,
} from '../../utiles/validadores';
import { IconoComponent } from '../utiles/icono/icono.component';
import { PopupComponent } from '../utiles/popup/popup.component';

type CampoRegistro = 'nombre' | 'apellido' | 'correo' | 'fecha' | 'contrasenya' | 'repetir';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [ReactiveFormsModule, IconoComponent, PopupComponent],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistroComponent {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly usuarios = inject(UsuarioService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly t = inject(I18nService).t;
  protected readonly verContrasenya = signal(false);
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);
  /** Usuario recién creado; mientras no sea `null` se muestra el popup de bienvenida. */
  protected readonly cuentaCreada = signal<User | null>(null);

  protected readonly formulario = this.fb.group(
    {
      nombre: ['', [Validators.required, Validators.maxLength(60)]],
      apellido: ['', [Validators.required, Validators.maxLength(60)]],
      correo: ['', [Validators.required, Validators.pattern(EMAIL), Validators.maxLength(254)]],
      fecha: ['', [Validators.required, fechaNacimientoValidator]],
      contrasenya: ['', [Validators.required, Validators.pattern(CONTRASENYA)]],
      repetir: ['', Validators.required],
    },
    { validators: coincidenValidator('contrasenya', 'repetir') },
  );

  protected crearCuenta(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    if (this.enviando()) {
      return;
    }

    this.errorGeneral.set(null);
    this.enviando.set(true);

    const datos = this.formulario.getRawValue();
    this.auth
      .registrar({
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        correo: datos.correo.trim(),
        fechaNacimiento: datos.fecha,
        contrasenya: datos.contrasenya,
      })
      .pipe(finalize(() => this.enviando.set(false)))
      .subscribe({
        next: (sesion) => this.bienvenida(sesion),
        error: (e: unknown) => this.mostrarError(e),
      });
  }

  protected volverAlLogin(): void {
    void this.router.navigate(['/login']);
  }

  protected invalido(campo: CampoRegistro): boolean {
    const control = this.formulario.controls[campo];
    const tocado = control.touched || control.dirty;
    if (campo === 'repetir') {
      return tocado && (control.invalid || this.formulario.hasError('noCoinciden'));
    }
    return control.invalid && tocado;
  }

  protected error(campo: CampoRegistro): string {
    const control = this.formulario.controls[campo];
    if (control.hasError('required')) {
      return this.t('comun.obligatorio');
    }
    if (control.hasError('existente')) {
      return this.t('registro.correoExistente');
    }

    switch (campo) {
      case 'correo':
        return this.t('comun.emailInvalido');
      case 'fecha':
        return this.t('comun.fechaInvalida');
      case 'contrasenya':
        return this.t('comun.contrasenyaPolitica');
      case 'repetir':
        return this.t('comun.contrasenyasNoCoinciden');
      default:
        return this.t('comun.campoMaximo', { max: 60 });
    }
  }

  /** Cierra el popup de bienvenida y lleva a la fecha VAU. */
  protected entendido(): void {
    this.cuentaCreada.set(null);
    void this.router.navigate(['/home']);
  }

  /**
   * La sesión se inicia ya, pero no se sale de la pantalla hasta que el
   * usuario confirma que ha visto su código de usuario.
   */
  private bienvenida(sesion: Sesion): void {
    this.usuarios.iniciarSesion(sesion);
    this.cuentaCreada.set(sesion.usuario);
  }

  private mostrarError(e: unknown): void {
    const error = errorUsuario(e);

    switch (error?.codigo) {
      case 'CORREO_EXISTENTE':
        this.formulario.controls.correo.setErrors({ existente: true });
        this.formulario.controls.correo.markAsTouched();
        break;

      case 'FECHA_NACIMIENTO_INVALIDA':
        this.formulario.controls.fecha.setErrors({ fechaInvalida: true });
        this.formulario.controls.fecha.markAsTouched();
        break;

      default:
        this.errorGeneral.set(mensajeErrorComun(error, this.t));
    }
  }
}
