import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  output,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  Acontecimiento,
  Pagina,
  TAMANYOS_PAGINA,
  TAMANYO_PAGINA_POR_DEFECTO,
} from '../../../interfaces/acontecimiento';
import { I18nService } from '../../../servicios/i18n.service';
import { AcontecimientosService } from '../../../servicios/acontecimientos.service';
import { formatearFechaLarga } from '../../../utiles/fechas';
import { IconoComponent } from '../icono/icono.component';
import { PaginadorComponent } from '../paginador/paginador.component';
import { VolverComponent } from '../volver/volver.component';
import { ModoAcontecimiento, AcontecimientoPopupComponent } from './acontecimiento-popup.component';

interface PopupAbierto {
  readonly modo: ModoAcontecimiento;
  readonly acontecimiento: Acontecimiento | null;
}

/** Preferencia del propio navegador: cuántos acontecimientos ver por página. */
const CLAVE_TAMANYO = 'vau.acontecimientos.tamanyo';

/**
 * Lista paginada de acontecimientos destacados del usuario (solo registrados;
 * lo filtra `HomeComponent`). El back pagina: nunca se descargan todos.
 */
@Component({
  selector: 'app-acontecimientos',
  standalone: true,
  imports: [IconoComponent, AcontecimientoPopupComponent, PaginadorComponent, VolverComponent],
  templateUrl: './acontecimientos.component.html',
  styleUrl: './acontecimientos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcontecimientosComponent implements OnInit {
  readonly back = output<void>();
  readonly irAFecha = output<string>();

  private readonly servicio = inject(AcontecimientosService);
  private readonly i18n = inject(I18nService);
  private peticion?: Subscription;

  protected readonly t = this.i18n.t;
  protected readonly tamanyos = TAMANYOS_PAGINA;
  protected readonly pagina = signal<Pagina<Acontecimiento> | null>(null);
  protected readonly tamanyo = signal(tamanyoGuardado());
  protected readonly cargando = signal(true);
  protected readonly hayError = signal(false);
  protected readonly popup = signal<PopupAbierto | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => this.peticion?.unsubscribe());
  }

  ngOnInit(): void {
    this.cargar(0);
  }

  /** Pide una página; si llega otra petición antes, la anterior se descarta. */
  protected cargar(numero = this.pagina()?.pagina ?? 0): void {
    this.peticion?.unsubscribe();
    this.cargando.set(true);
    this.hayError.set(false);
    this.peticion = this.servicio.listar(numero, this.tamanyo()).subscribe({
      next: (pagina) => {
        this.pagina.set(pagina);
        this.cargando.set(false);
      },
      error: () => {
        this.hayError.set(true);
        this.cargando.set(false);
      },
    });
  }

  protected cambiarTamanyo(tamanyo: number): void {
    // Se mantiene a la vista el primer elemento que se estaba viendo.
    const primero = (this.pagina()?.pagina ?? 0) * this.tamanyo();
    this.tamanyo.set(tamanyo);
    try {
      localStorage.setItem(CLAVE_TAMANYO, String(tamanyo));
    } catch {
      /* sin almacenamiento: la preferencia solo dura esta visita */
    }
    this.cargar(Math.floor(primero / tamanyo));
  }

  protected fecha(iso: string): string {
    return formatearFechaLarga(iso, this.i18n.locale());
  }

  protected abrir(modo: ModoAcontecimiento, acontecimiento: Acontecimiento | null = null): void {
    this.popup.set({ modo, acontecimiento });
  }

  protected cerrarPopup(): void {
    this.popup.set(null);
  }

  /** Tras crear, modificar o eliminar se recarga la página actual (el orden lo decide el back). */
  protected alCambiar(): void {
    this.cerrarPopup();
    this.cargar();
  }

  protected irA(fecha: string): void {
    this.cerrarPopup();
    this.irAFecha.emit(fecha);
  }
}

function tamanyoGuardado(): number {
  try {
    const guardado = Number(localStorage.getItem(CLAVE_TAMANYO));
    if ((TAMANYOS_PAGINA as readonly number[]).includes(guardado)) {
      return guardado;
    }
  } catch {
    /* almacenamiento no disponible */
  }
  return TAMANYO_PAGINA_POR_DEFECTO;
}
