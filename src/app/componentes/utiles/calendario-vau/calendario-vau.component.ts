import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, filter, map, of, share, startWith, switchMap, tap } from 'rxjs';
import { ClaveTraduccion } from '../../../i18n/idiomas';
import {
  AnyoIndice,
  DiaCalendario,
  Lunacion,
  MesIndice,
  MetonoIndice,
} from '../../../interfaces/calendario';
import { AcontecimientosService } from '../../../servicios/acontecimientos.service';
import { CalendarioService } from '../../../servicios/calendario.service';
import { I18nService } from '../../../servicios/i18n.service';
import { UsuarioService } from '../../../servicios/usuario.service';
import { formatearFechaLarga, hoyIso, isoADate } from '../../../utiles/fechas';
import { IconoComponent } from '../icono/icono.component';
import { VolverComponent } from '../volver/volver.component';

type Estado =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'ok'; readonly lunacion: Lunacion }
  | { readonly tipo: 'error' };

/** Rejilla de una lunación: fila Terra, semanas Primana..Limana y 7 columnas. */
interface Rejilla {
  readonly terra: DiaCalendario | null;
  readonly filas: ReadonlyArray<{ readonly semana: number; readonly celdas: ReadonlyArray<DiaCalendario | null> }>;
  readonly sinPosicion: readonly DiaCalendario[];
}

const SEMANAS_MINIMAS = 4;

/**
 * Calendario VAU organizado por lunaciones (mes lunar fasal), con el estilo
 * del calendario anual en PDF. La posición (fecha) la guarda `HomeComponent`,
 * así que volver al calendario lo deja donde estaba.
 */
@Component({
  selector: 'app-calendario-vau',
  standalone: true,
  imports: [IconoComponent, VolverComponent],
  templateUrl: './calendario-vau.component.html',
  styleUrl: './calendario-vau.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarioVAUComponent implements OnInit {
  /** Cualquier fecha de la lunación que se quiere ver. */
  readonly fecha = input.required<string>();
  readonly fechaChange = output<string>();
  readonly abrirDia = output<string>();
  readonly back = output<void>();

  private readonly calendario = inject(CalendarioService);
  private readonly acontecimientos = inject(AcontecimientosService);
  private readonly usuarios = inject(UsuarioService);
  private readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;
  protected readonly hoy = hoyIso();
  private readonly recarga = signal(0);

  private readonly estado$ = toObservable(
    computed(() => ({ fecha: this.fecha(), intento: this.recarga() })),
  ).pipe(
    switchMap(({ fecha }) =>
      this.calendario.lunacion(fecha).pipe(
        tap((lunacion) => this.calendario.precargarVecinas(lunacion)),
        map((lunacion): Estado => ({ tipo: 'ok', lunacion })),
        catchError(() => of<Estado>({ tipo: 'error' })),
        startWith<Estado>({ tipo: 'cargando' }),
      ),
    ),
    share(),
  );

  private readonly estado = toSignal(this.estado$, { initialValue: { tipo: 'cargando' } as Estado });

  /** La última lunación cargada se mantiene mientras llega la siguiente: no hay parpadeos al navegar. */
  protected readonly lunacion = toSignal(
    this.estado$.pipe(
      filter((estado): estado is Extract<Estado, { tipo: 'ok' }> => estado.tipo === 'ok'),
      map((estado) => estado.lunacion),
    ),
    { initialValue: null },
  );
  protected readonly cargando = computed(() => this.estado().tipo === 'cargando');
  protected readonly hayError = computed(() => this.estado().tipo === 'error');

  protected readonly contieneHoy = computed(() => {
    const l = this.lunacion();
    return !!l && l.inicio <= this.hoy && this.hoy <= l.fin;
  });

  protected readonly rejilla = computed<Rejilla | null>(() => {
    const l = this.lunacion();
    if (!l) {
      return null;
    }

    let terra: DiaCalendario | null = null;
    const posiciones = new Map<number, DiaCalendario>();
    const sinPosicion: DiaCalendario[] = [];
    let semanas = SEMANAS_MINIMAS;

    for (const dia of l.dias) {
      if (dia.terra && !terra) {
        terra = dia;
      } else if (dia.semana !== null && dia.columna !== null) {
        posiciones.set((dia.semana - 1) * 7 + dia.columna, dia);
        semanas = Math.max(semanas, dia.semana);
      } else {
        sinPosicion.push(dia);
      }
    }

    const filas = Array.from({ length: semanas }, (_, s) => ({
      semana: s + 1,
      celdas: Array.from({ length: 7 }, (_, c) => posiciones.get(s * 7 + c) ?? null),
    }));
    return { terra, filas, sinPosicion };
  });

  /** Días con festividad, evento o acontecimiento, para la lista bajo la rejilla. */
  protected readonly senyalados = computed(() =>
    (this.lunacion()?.dias ?? []).filter(
      (d) => d.festividad || d.evento || this.conAcontecimiento().has(d.fecha),
    ),
  );

  // --- Acontecimientos del usuario ----------------------------------------
  protected readonly registrado = this.usuarios.esRegistrado;
  protected readonly conAcontecimiento = signal<ReadonlySet<string>>(new Set());

  // --- Selector métono -> año -> mes --------------------------------------
  protected readonly selectorAbierto = signal(false);
  protected readonly metonos = signal<readonly MetonoIndice[]>([]);
  protected readonly anyos = signal<readonly AnyoIndice[]>([]);
  protected readonly meses = signal<readonly MesIndice[]>([]);
  protected readonly metonoElegido = signal<MetonoIndice | null>(null);
  protected readonly anyoElegido = signal<AnyoIndice | null>(null);
  protected readonly mesElegido = signal<MesIndice | null>(null);
  protected readonly cargandoIndice = signal(false);
  protected readonly errorIndice = signal(false);

  ngOnInit(): void {
    if (this.usuarios.esRegistrado()) {
      this.acontecimientos.fechas().subscribe({
        next: (fechas) => this.conAcontecimiento.set(new Set(fechas)),
        error: () => {
          /* sin estrellas: el calendario sigue funcionando */
        },
      });
    }
  }

  // --- Navegación ----------------------------------------------------------

  protected irA(fecha: string | null): void {
    if (fecha) {
      this.fechaChange.emit(fecha);
    }
  }

  protected irAHoy(): void {
    this.irA(this.hoy);
  }

  protected reintentar(): void {
    this.recarga.update((v) => v + 1);
  }

  protected alternarSelector(): void {
    this.selectorAbierto.update((abierto) => !abierto);
    if (this.selectorAbierto()) {
      this.prepararSelector();
    }
  }

  /** Abre el selector en el métono, año y mes de la lunación que se está viendo. */
  private prepararSelector(): void {
    this.cargandoIndice.set(true);
    this.errorIndice.set(false);
    this.calendario.metonos().subscribe({
      next: (metonos) => {
        this.metonos.set(metonos);
        const actual = this.lunacion();
        const metono =
          metonos.find((m) => m.numero === actual?.metono) ?? metonos[metonos.length - 1] ?? null;
        this.elegirMetono(metono, actual?.anyo ?? null, actual?.meses[0]?.nombre ?? null);
      },
      error: () => this.fallarIndice(),
    });
  }

  protected cambiarMetono(evento: Event): void {
    const id = Number((evento.target as HTMLSelectElement).value);
    this.elegirMetono(this.metonos().find((m) => m.id === id) ?? null, null, null);
  }

  protected cambiarAnyo(evento: Event): void {
    const numero = Number((evento.target as HTMLSelectElement).value);
    this.elegirAnyo(this.anyos().find((a) => a.numero === numero) ?? null, null);
  }

  protected cambiarMes(evento: Event): void {
    const fecha = (evento.target as HTMLSelectElement).value;
    this.mesElegido.set(this.meses().find((m) => m.fecha === fecha) ?? null);
  }

  protected irAlMesElegido(): void {
    const mes = this.mesElegido();
    if (mes) {
      this.irA(mes.fecha);
      this.selectorAbierto.set(false);
    }
  }

  private elegirMetono(metono: MetonoIndice | null, anyoPreferido: string | null, mesPreferido: string | null): void {
    this.metonoElegido.set(metono);
    this.anyos.set([]);
    this.meses.set([]);
    this.anyoElegido.set(null);
    this.mesElegido.set(null);
    if (!metono) {
      this.cargandoIndice.set(false);
      return;
    }

    this.cargandoIndice.set(true);
    this.calendario.anyos(metono.id).subscribe({
      next: (anyos) => {
        this.anyos.set(anyos);
        const anyo = anyos.find((a) => String(a.numero) === anyoPreferido) ?? anyos[0] ?? null;
        this.elegirAnyo(anyo, mesPreferido);
      },
      error: () => this.fallarIndice(),
    });
  }

  private elegirAnyo(anyo: AnyoIndice | null, mesPreferido: string | null): void {
    this.anyoElegido.set(anyo);
    this.meses.set([]);
    this.mesElegido.set(null);
    if (!anyo) {
      this.cargandoIndice.set(false);
      return;
    }

    this.cargandoIndice.set(true);
    this.calendario.meses(anyo).subscribe({
      next: (meses) => {
        this.meses.set(meses);
        this.mesElegido.set(meses.find((m) => m.nombre === mesPreferido) ?? meses[0] ?? null);
        this.cargandoIndice.set(false);
      },
      error: () => this.fallarIndice(),
    });
  }

  private fallarIndice(): void {
    this.cargandoIndice.set(false);
    this.errorIndice.set(true);
  }

  // --- Presentación ---------------------------------------------------------

  protected nombreEstacion(estacion: number): string {
    return this.t(`calendarioVau.estacion${estacion}` as ClaveTraduccion);
  }

  protected fechaLarga(iso: string): string {
    return formatearFechaLarga(iso, this.i18n.locale());
  }

  /** «23 oct»; el día 1 lleva siempre el mes para que se vea el cambio. */
  protected fechaCivil(iso: string): string {
    const fecha = isoADate(iso);
    if (!fecha) {
      return iso;
    }
    return new Intl.DateTimeFormat(this.i18n.locale(), { day: 'numeric', month: 'short', timeZone: 'UTC' })
      .format(fecha)
      .replace('.', '');
  }

  protected numeroDia(iso: string): number {
    return isoADate(iso)?.getUTCDate() ?? 0;
  }

  protected numeroDias(l: Lunacion): number {
    const inicio = isoADate(l.inicio)!;
    const fin = isoADate(l.fin)!;
    return Math.round((fin.getTime() - inicio.getTime()) / 86_400_000) + 1;
  }

  /** Fondo como en el PDF: festividad (y solsticio/equinoccio) en amarillo, eclipse en morado, si no la estación. */
  protected claseFondo(dia: DiaCalendario): string {
    if (dia.festividad || dia.estacion === 0) {
      return 'festivo';
    }
    if (dia.eclipse) {
      return 'eclipse';
    }
    return `estacion-${dia.estacion}`;
  }

  /** El evento solo se repite si dice algo distinto de la festividad (p. ej. el midsison). */
  protected eventoVisible(dia: DiaCalendario): string | null {
    return dia.evento && dia.evento !== dia.festividad ? dia.evento : null;
  }

  protected etiquetaDia(dia: DiaCalendario): string {
    const partes = [this.fechaLarga(dia.fecha)];
    if (dia.dia) {
      partes.push(dia.apellidoDia ? `${dia.dia} ${dia.apellidoDia}` : dia.dia);
    }
    if (dia.festividad) {
      partes.push(dia.festividad);
    }
    const evento = this.eventoVisible(dia);
    if (evento) {
      partes.push(evento);
    }
    if (this.conAcontecimiento().has(dia.fecha)) {
      partes.push(this.t('calendarioVau.leyendaAcontecimiento'));
    }
    return partes.join(' · ');
  }

  // --- Atajos y gestos --------------------------------------------------------

  /** RePág / AvPág cambian de lunación (las flechas se quedan para moverse por la rejilla). */
  @HostListener('document:keydown', ['$event'])
  protected atajos(evento: KeyboardEvent): void {
    if (evento.key !== 'PageUp' && evento.key !== 'PageDown') {
      return;
    }
    const destino = evento.target as HTMLElement | null;
    if (destino?.closest('input, textarea, select, [role="dialog"], [role="alertdialog"]')) {
      return;
    }
    const l = this.lunacion();
    if (!l) {
      return;
    }
    evento.preventDefault();
    this.irA(evento.key === 'PageUp' ? l.anterior : l.siguiente);
  }

  private inicioX = 0;
  private inicioY = 0;

  protected inicioGesto(evento: PointerEvent): void {
    if (evento.pointerType === 'touch') {
      this.inicioX = evento.clientX;
      this.inicioY = evento.clientY;
    }
  }

  protected finGesto(evento: PointerEvent): void {
    if (evento.pointerType !== 'touch') {
      return;
    }
    const dx = evento.clientX - this.inicioX;
    const dy = evento.clientY - this.inicioY;
    const l = this.lunacion();
    if (l && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) {
      this.irA(dx < 0 ? l.siguiente : l.anterior);
    }
  }
}
