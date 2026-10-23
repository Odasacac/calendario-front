import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { AccionOpcion, Opcion } from '../../interfaces/opciones';
import { I18nService } from '../../servicios/i18n.service';
import { UsuarioService } from '../../servicios/usuario.service';
import { hoyIso } from '../../utiles/fechas';
import { CuentaComponent } from '../utiles/cuenta/cuenta.component';
import { DateVAUComponent } from '../utiles/date-vau/date-vau.component';
import { DescargasComponent } from '../utiles/descargas/descargas.component';
import { AcontecimientosComponent } from '../utiles/acontecimientos/acontecimientos.component';
import { CalendarioComponent } from '../utiles/calendario/calendario.component';
import { CalendarioVAUComponent } from '../utiles/calendario-vau/calendario-vau.component';
import { IconoComponent } from '../utiles/icono/icono.component';

type Vista = 'vau' | 'calendario' | 'descargas' | 'cuenta' | 'acontecimientos';

/** Secciones abiertas a cualquiera (invitados incluidos). */
const VISTAS_PUBLICAS: ReadonlySet<Vista> = new Set<Vista>(['calendario', 'descargas']);

/** Secciones que solo ven los usuarios registrados. */
const VISTAS_PRIVADAS: ReadonlySet<Vista> = new Set<Vista>(['cuenta', 'acontecimientos']);

const OPCIONES: Readonly<Record<AccionOpcion, Opcion>> = {
  'fecha-vau': {
    accion: 'fecha-vau',
    clave: 'home.opcionFechaVau',
    icono: 'calendario',
    soloRegistrados: false,
  },
  calendario: {
    accion: 'calendario',
    clave: 'home.opcionCalendario',
    icono: 'rejilla',
    soloRegistrados: false,
  },
  descargas: {
    accion: 'descargas',
    clave: 'home.opcionDescargas',
    icono: 'descargar',
    soloRegistrados: false,
  },
  acontecimientos: {
    accion: 'acontecimientos',
    clave: 'home.opcionAcontecimientos',
    icono: 'estrella',
    soloRegistrados: true,
  },
  cuenta: {
    accion: 'cuenta',
    clave: 'home.opcionCuenta',
    icono: 'usuario',
    soloRegistrados: true,
  },
};

const VISTA_DE_OPCION: Readonly<Record<AccionOpcion, Vista>> = {
  'fecha-vau': 'vau',
  calendario: 'calendario',
  descargas: 'descargas',
  acontecimientos: 'acontecimientos',
  cuenta: 'cuenta',
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    AcontecimientosComponent,
    CalendarioComponent,
    CalendarioVAUComponent,
    CuentaComponent,
    DateVAUComponent,
    DescargasComponent,
    IconoComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly router = inject(Router);
  private readonly usuarios = inject(UsuarioService);

  private readonly contenedorMenu =
    viewChild<ElementRef<HTMLElement>>('contenedorMenu');

  protected readonly t = inject(I18nService).t;

  /**
   * `?seccion=` de la URL (lo enlaza `withComponentInputBinding`). Llevar la
   * sección en la URL permite abrir «Mi cuenta» desde la cabecera y que el
   * botón «atrás» del navegador vuelva a la sección anterior.
   */
  readonly seccion = input<string | undefined>();

  /** `null` = hoy; cualquier otro valor es una fecha ISO concreta. */
  protected readonly fecha = signal<string | null>(null);
  protected readonly menuAbierto = signal(false);
  protected readonly selectorAbierto = signal(false);

  /**
   * Posición del Calendario VAU, independiente de la fecha VAU: convertir una
   * fecha no mueve el calendario, y volver a él lo deja donde estaba.
   */
  protected readonly fechaCalendario = signal(hoyIso());
  /** La fecha VAU se abrió pulsando un día del calendario: ofrece volver a él. */
  protected readonly desdeCalendario = signal(false);

  /** Una sección desconocida, o privada sin sesión de usuario, cae en la fecha VAU. */
  protected readonly vista = computed<Vista>(() => {
    const seccion = this.seccion() as Vista | undefined;
    const conocida = seccion && (VISTAS_PUBLICAS.has(seccion) || VISTAS_PRIVADAS.has(seccion));
    if (!seccion || !conocida) {
      return 'vau';
    }
    return VISTAS_PRIVADAS.has(seccion) && !this.usuarios.esRegistrado() ? 'vau' : seccion;
  });

  protected readonly esHoy = computed(() => this.fecha() === null);
  protected readonly fechaDelSelector = computed(() => this.fecha() ?? hoyIso());

  /** Opciones del menú: todas menos la vista actual, filtradas por tipo de sesión. */
  protected readonly opciones = computed<readonly Opcion[]>(() => {
    const registrado = this.usuarios.esRegistrado();
    const actual = this.vista();
    return Object.values(OPCIONES).filter(
      (opcion) =>
        VISTA_DE_OPCION[opcion.accion] !== actual && (!opcion.soloRegistrados || registrado),
    );
  });

  protected alternarMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
    this.selectorAbierto.set(false);
  }

  protected alternarSelector(): void {
    // Al abrirse, el calendario pone el foco en el día elegido.
    this.selectorAbierto.update((abierto) => !abierto);
    this.menuAbierto.set(false);
  }

  protected ejecutar(opcion: Opcion): void {
    this.menuAbierto.set(false);
    this.irA(VISTA_DE_OPCION[opcion.accion]);
  }

  protected irA(vista: Vista): void {
    if (vista !== 'vau') {
      this.selectorAbierto.set(false);
    }
    if (vista !== 'vau' && vista !== 'calendario') {
      this.desdeCalendario.set(false);
    }
    void this.router.navigate(['/home'], {
      queryParams: { seccion: vista === 'vau' ? null : vista },
    });
  }

  protected irAVau(): void {
    this.irA('vau');
  }

  /** Pulsar un día del calendario abre su detalle: la fecha VAU de ese día. */
  protected abrirDiaDelCalendario(fecha: string): void {
    this.fecha.set(fecha === hoyIso() ? null : fecha);
    this.desdeCalendario.set(true);
    this.irA('vau');
  }

  protected volverAlCalendario(): void {
    this.irA('calendario');
  }

  /** Desde la lista de acontecimientos: abre la fecha VAU en el día del acontecimiento. */
  protected irAFecha(fecha: string): void {
    this.fecha.set(fecha === hoyIso() ? null : fecha);
    this.irA('vau');
  }

  /**
   * El calendario ya devuelve `yyyy-MM-dd`; usarlo tal cual evita el
   * desfase de un día que provocaba `new Date(...).toISOString()`.
   */
  protected seleccionarFecha(valor: string): void {
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
