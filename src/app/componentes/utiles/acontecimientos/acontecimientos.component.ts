import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  output,
  signal,
} from '@angular/core';
import { Acontecimiento } from '../../../interfaces/acontecimiento';
import { I18nService } from '../../../servicios/i18n.service';
import { AcontecimientosService } from '../../../servicios/acontecimientos.service';
import { formatearFechaLarga } from '../../../utiles/fechas';
import { IconoComponent } from '../icono/icono.component';
import { ModoAcontecimiento, AcontecimientoPopupComponent } from './acontecimiento-popup.component';

interface PopupAbierto {
  readonly modo: ModoAcontecimiento;
  readonly acontecimiento: Acontecimiento | null;
}

/** Lista de acontecimientos destacados del usuario (solo registrados; lo filtra `HomeComponent`). */
@Component({
  selector: 'app-acontecimientos',
  standalone: true,
  imports: [IconoComponent, AcontecimientoPopupComponent],
  templateUrl: './acontecimientos.component.html',
  styleUrl: './acontecimientos.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcontecimientosComponent implements OnInit {
  readonly back = output<void>();
  readonly irAFecha = output<string>();

  private readonly servicio = inject(AcontecimientosService);
  private readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;
  protected readonly acontecimientos = signal<readonly Acontecimiento[]>([]);
  protected readonly cargando = signal(true);
  protected readonly hayError = signal(false);
  protected readonly popup = signal<PopupAbierto | null>(null);

  ngOnInit(): void {
    this.cargar();
  }

  protected cargar(): void {
    this.cargando.set(true);
    this.hayError.set(false);
    this.servicio.listar().subscribe({
      next: (acontecimientos) => {
        this.acontecimientos.set(acontecimientos);
        this.cargando.set(false);
      },
      error: () => {
        this.hayError.set(true);
        this.cargando.set(false);
      },
    });
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

  /** Inserta o sustituye y mantiene el orden de más reciente a más antiguo. */
  protected alGuardar(acontecimiento: Acontecimiento): void {
    this.acontecimientos.update((lista) =>
      [...lista.filter((s) => s.id !== acontecimiento.id), acontecimiento].sort((a, b) =>
        b.fecha.localeCompare(a.fecha),
      ),
    );
    this.cerrarPopup();
  }

  protected alEliminar(acontecimiento: Acontecimiento): void {
    this.acontecimientos.update((lista) => lista.filter((s) => s.id !== acontecimiento.id));
    this.cerrarPopup();
  }

  protected irA(fecha: string): void {
    this.cerrarPopup();
    this.irAFecha.emit(fecha);
  }
}
