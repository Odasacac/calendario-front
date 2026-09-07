import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Idioma } from '../../../i18n/idiomas';
import { I18nService } from '../../../servicios/i18n.service';
import { NotificacionesService } from '../../../servicios/notificaciones.service';
import { TemaService } from '../../../servicios/tema.service';
import { UsuarioService } from '../../../servicios/usuario.service';
import { IconoComponent } from '../../utiles/icono/icono.component';

@Component({
  selector: 'app-cabecera',
  standalone: true,
  imports: [IconoComponent],
  templateUrl: './cabecera.component.html',
  styleUrl: './cabecera.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CabeceraComponent {
  private readonly router = inject(Router);
  private readonly avisos = inject(NotificacionesService);

  protected readonly i18n = inject(I18nService);
  protected readonly tema = inject(TemaService);
  protected readonly usuarios = inject(UsuarioService);
  protected readonly t = this.i18n.t;

  protected cambiarIdioma(evento: Event): void {
    const valor = (evento.target as HTMLSelectElement).value as Idioma;
    this.i18n.cambiar(valor);
  }

  protected cerrarSesion(): void {
    this.usuarios.cerrarSesion();
    this.avisos.info(this.t('sesion.sesionCerrada'));
    void this.router.navigate(['/login']);
  }
}
