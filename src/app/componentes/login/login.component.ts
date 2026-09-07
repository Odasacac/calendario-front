import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { I18nService } from '../../servicios/i18n.service';
import { NotificacionesService } from '../../servicios/notificaciones.service';
import { UsuarioService } from '../../servicios/usuario.service';
import { IconoComponent } from '../utiles/icono/icono.component';

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
  private readonly usuarios = inject(UsuarioService);
  private readonly avisos = inject(NotificacionesService);
  private readonly fb = inject(NonNullableFormBuilder);

  protected readonly t = inject(I18nService).t;
  protected readonly verContrasenya = signal(false);

  protected readonly formulario = this.fb.group({
    user: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected enviar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    // El backend todavía no expone autenticación por usuario.
    this.avisos.info(this.t('login.pendiente'));
  }

  protected entrarComoInvitado(): void {
    this.usuarios.setEsInvitado(true);
    this.avisos.exito(this.t('login.bienvenidaInvitado'));
    void this.router.navigate(['/home']);
  }

  protected irA(ruta: string): void {
    void this.router.navigate([ruta]);
  }

  /** Muestra el error solo cuando el usuario ya ha interactuado con el campo. */
  protected invalido(campo: 'user' | 'password'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }
}
