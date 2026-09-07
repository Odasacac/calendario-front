import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CabeceraComponent } from './componentes/layout/cabecera/cabecera.component';
import { NotificacionesComponent } from './componentes/utiles/notificaciones/notificaciones.component';
import { I18nService } from './servicios/i18n.service';
import { TemaService } from './servicios/tema.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CabeceraComponent, NotificacionesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent {
  protected readonly t = inject(I18nService).t;

  constructor() {
    // Instanciar el servicio aplica el tema guardado y engancha el listener
    // de `prefers-color-scheme`.
    inject(TemaService);
  }
}
