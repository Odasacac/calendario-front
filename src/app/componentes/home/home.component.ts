import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { AccionOpcion, Opcion } from '../../interfaces/opciones';
import { I18nService } from '../../servicios/i18n.service';
import { NotificacionesService } from '../../servicios/notificaciones.service';
import { UsuarioService } from '../../servicios/usuario.service';
import { hoyIso } from '../../utiles/fechas';
import { DateVAUComponent } from '../utiles/date-vau/date-vau.component';
import { DescargasComponent } from '../utiles/descargas/descargas.component';
import { IconoComponent } from '../utiles/icono/icono.component';

type Vista = 'vau' | 'descargas';

const OPCIONES: Readonly<Record<AccionOpcion, Opcion>> = {
  descargas: {
    accion: 'descargas',
    clave: 'home.opcionDescargas',
    icono: 'descargar',
    soloRegistrados: false,
  },
  eventos: {
    accion: 'eventos',
    clave: 'home.opcionEventos',
    icono: 'estrella',
    soloRegistrados: true,
  },
  'fecha-vau': {
    accion: 'fecha-vau',
    clave: 'home.opcionFechaVau',
    icono: 'calendario',
    soloRegistrados: false,
  },
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DateVAUComponent, DescargasComponent, IconoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly usuarios = inject(UsuarioService);
  private readonly avisos = inject(NotificacionesService);

  private readonly contenedorMenu =
    viewChild<ElementRef<HTMLElement>>('contenedorMenu');
  private readonly campoFecha = viewChild<ElementRef<HTMLInputElement>>('campoFecha');

  protected readonly t = inject(I18nService).t;

  /** `null` = hoy; cualquier otro valor es una fecha ISO concreta. */
  protected readonly fecha = signal<string | null>(null);
  protected readonly vista = signal<Vista>('vau');
  protected readonly menuAbierto = signal(false);
  protected readonly selectorAbierto = signal(false);

  protected readonly esHoy = computed(() => this.fecha() === null);
  protected readonly fechaDelSelector = computed(() => this.fecha() ?? hoyIso());

  /** Opciones del menú según la vista actual y el tipo de sesión. */
  protected readonly opciones = computed<readonly Opcion[]>(() => {
    const disponibles =
      this.vista() === 'vau'
        ? [OPCIONES.descargas, OPCIONES.eventos]
        : [OPCIONES['fecha-vau'], OPCIONES.eventos];

    const registrado = this.usuarios.usuario() !== null;
    return disponibles.filter((opcion) => !opcion.soloRegistrados || registrado);
  });

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
    this.selectorAbierto.set(false);
  }

  protected alternarSelector(): void {
    this.selectorAbierto.update((abierto) => !abierto);
    this.menuAbierto.set(false);

    if (this.selectorAbierto()) {
      // El input lo crea `@if`, así que hay que esperar a que exista.
      setTimeout(() => this.campoFecha()?.nativeElement.focus());
    }
  }

  protected ejecutar(opcion: Opcion): void {
    this.menuAbierto.set(false);

    switch (opcion.accion) {
      case 'descargas':
        this.vista.set('descargas');
        this.selectorAbierto.set(false);
        break;

      case 'fecha-vau':
        this.vista.set('vau');
        break;

      case 'eventos':
        this.avisos.info(this.t('comun.enConstruccion'));
        break;
    }
  }

  protected irAVau(): void {
    this.vista.set('vau');
  }

  /**
   * El valor del input ya viene en `yyyy-MM-dd`; usarlo tal cual evita el
   * desfase de un día que provocaba `new Date(...).toISOString()`.
   */
  protected seleccionarFecha(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    if (!valor) {
      return;
    }

    this.fecha.set(valor === hoyIso() ? null : valor);
    this.selectorAbierto.set(false);
  }

  protected cambiarFecha(nueva: string): void {
    this.fecha.set(nueva === hoyIso() ? null : nueva);
  }

  protected volverAHoy(): void {
    this.fecha.set(null);
  }

  @HostListener('document:click', ['$event'])
  protected clickFuera(evento: MouseEvent): void {
    if (!this.menuAbierto()) {
      return;
    }

    const contenedor = this.contenedorMenu()?.nativeElement;
    if (contenedor && !contenedor.contains(evento.target as Node)) {
      this.menuAbierto.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  protected cerrarConEscape(): void {
    this.menuAbierto.set(false);
    this.selectorAbierto.set(false);
  }
}
