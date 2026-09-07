import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith, switchMap } from 'rxjs';
import { VAUResponse } from '../../../interfaces/vau-response';
import { DatesService } from '../../../servicios/dates.service';
import { I18nService } from '../../../servicios/i18n.service';
import { NotificacionesService } from '../../../servicios/notificaciones.service';
import {
  formatearDiaSemana,
  formatearFechaCorta,
  formatearFechaLarga,
  hoyIso,
  sumarDias,
} from '../../../utiles/fechas';
import { IconoComponent } from '../icono/icono.component';

type Estado =
  | { readonly tipo: 'cargando' }
  | { readonly tipo: 'ok'; readonly datos: VAUResponse }
  | { readonly tipo: 'no-encontrada'; readonly datos: VAUResponse }
  | { readonly tipo: 'error' };

@Component({
  selector: 'app-date-vau',
  standalone: true,
  imports: [IconoComponent],
  templateUrl: './date-vau.component.html',
  styleUrl: './date-vau.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateVAUComponent {
  /** Fecha ISO a consultar; `null` significa «hoy» (endpoint /today). */
  readonly fecha = input<string | null>(null);
  readonly fechaChange = output<string>();

  private readonly dates = inject(DatesService);
  private readonly avisos = inject(NotificacionesService);
  private readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;
  protected readonly detalles = signal(false);

  /** Huecos del esqueleto de carga. */
  protected readonly huecos = [1, 2, 3, 4, 5];

  /** Une varios campos de la API y devuelve «—» si no hay ninguno. */
  protected readonly valor = texto;

  /** Se incrementa al pulsar «reintentar» para forzar una nueva petición. */
  private readonly recarga = signal(0);

  private readonly peticion = computed(() => ({
    fecha: this.fecha(),
    intento: this.recarga(),
  }));

  /**
   * `switchMap` cancela la petición anterior: al pulsar rápido las flechas
   * solo se pinta la respuesta de la última fecha pedida.
   */
  private readonly estado = toSignal(
    toObservable(this.peticion).pipe(
      switchMap(({ fecha }) =>
        (fecha ? this.dates.getVAU(fecha) : this.dates.getTodayVAU()).pipe(
          map((datos): Estado =>
            datos.fechaEncontrada
              ? { tipo: 'ok', datos }
              : { tipo: 'no-encontrada', datos },
          ),
          catchError(() => of<Estado>({ tipo: 'error' })),
          startWith<Estado>({ tipo: 'cargando' }),
        ),
      ),
    ),
    { initialValue: { tipo: 'cargando' } as Estado },
  );

  protected readonly cargando = computed(() => this.estado().tipo === 'cargando');
  protected readonly hayError = computed(() => this.estado().tipo === 'error');

  protected readonly datos = computed(() => {
    const estado = this.estado();
    return estado.tipo === 'ok' || estado.tipo === 'no-encontrada'
      ? estado.datos
      : undefined;
  });

  protected readonly noEncontrada = computed(
    () => this.estado().tipo === 'no-encontrada',
  );

  /** Fecha realmente mostrada: la que devuelve la API o, si aún no ha llegado, la pedida. */
  protected readonly fechaResuelta = computed(
    () => this.datos()?.fechaO ?? this.fecha() ?? hoyIso(),
  );

  protected readonly fechaLarga = computed(() =>
    formatearFechaLarga(this.fechaResuelta(), this.i18n.locale()),
  );

  protected readonly diaSemana = computed(() =>
    formatearDiaSemana(this.fechaResuelta(), this.i18n.locale()),
  );

  protected readonly fechaCorta = computed(() =>
    formatearFechaCorta(this.fechaResuelta()),
  );

  /** Descripción legible del casalero, compuesta a partir de sus banderas. */
  protected readonly descripcionCasalero = computed(() => {
    const casalero = this.datos()?.casalero;
    if (!casalero) {
      return '';
    }

    const tipo = casalero.tipo?.toUpperCase() ?? '';

    if (tipo === 'ECLIPELAR') {
      if (casalero.deSol) return this.t('vau.casaleroEclipelarSol');
      if (casalero.deLuna) return this.t('vau.casaleroEclipelarLuna');
      return this.t('vau.casaleroEclipelar');
    }

    if (tipo === 'METÓNICO' || tipo === 'METONICO') {
      const estacion = casalero.invernal
        ? this.t('vau.casaleroInvernal')
        : casalero.primaveral
          ? this.t('vau.casaleroPrimaveral')
          : casalero.estival
            ? this.t('vau.casaleroEstival')
            : casalero.otonyal
              ? this.t('vau.casaleroOtonyal')
              : '';

      const fase = casalero.nuevo
        ? this.t('vau.casaleroNuevo')
        : casalero.lleno
          ? this.t('vau.casaleroLleno')
          : '';

      return [this.t('vau.casaleroMetonico'), estacion, fase]
        .filter(Boolean)
        .join(' ');
    }

    return '';
  });

  protected cambiarDia(dias: number): void {
    const nueva = sumarDias(this.fechaResuelta(), dias);
    if (!nueva) {
      return;
    }

    this.detalles.set(false);
    this.fechaChange.emit(nueva);
  }

  protected reintentar(): void {
    this.recarga.update((valor) => valor + 1);
  }

  protected alternarDetalles(): void {
    this.detalles.update((abierto) => !abierto);
  }

  protected imprimir(): void {
    window.print();
  }

  protected async copiarResumen(): Promise<void> {
    const datos = this.datos();
    if (!datos) {
      return;
    }

    const lineas = [
      `${this.fechaLarga()} (${this.fechaCorta()})`,
      `${this.t('vau.estacion')}: ${texto(datos.season?.name, datos.season?.surname)}`,
      `${this.t('vau.mesFasal')}: ${texto(datos.month?.name, datos.month?.surname)}`,
      `${this.t('vau.semana')}: ${texto(datos.week)}`,
      `${this.t('vau.dia')}: ${texto(datos.day)}`,
      `${this.t('vau.anyo')}: ${texto(datos.year?.solsticiosDeInviernoSinceLastMetonIN)}`,
    ];

    if (datos.festividades?.festividadActual) {
      lineas.push(`${this.t('vau.festividad')}: ${datos.festividades.festividadActual}`);
    }
    if (datos.notableEvent?.today) {
      lineas.push(`${this.t('vau.eventoResenyable')}: ${datos.notableEvent.today}`);
    }

    try {
      await navigator.clipboard.writeText(lineas.join('\n'));
      this.avisos.exito(this.t('vau.copiado'));
    } catch {
      this.avisos.error(this.t('vau.copiadoError'));
    }
  }

  /** Flechas ← → para cambiar de día, salvo si el foco está en un campo. */
  @HostListener('document:keydown', ['$event'])
  protected atajosTeclado(evento: KeyboardEvent): void {
    if (evento.altKey || evento.ctrlKey || evento.metaKey || evento.shiftKey) {
      return;
    }

    if (evento.key !== 'ArrowLeft' && evento.key !== 'ArrowRight') {
      return;
    }

    const destino = evento.target as HTMLElement | null;
    if (destino?.closest('input, textarea, select, [contenteditable="true"]')) {
      return;
    }

    evento.preventDefault();
    this.cambiarDia(evento.key === 'ArrowLeft' ? -1 : 1);
  }

  // --- Gesto de deslizamiento en pantallas táctiles -----------------------
  private inicioX = 0;
  private inicioY = 0;

  protected inicioGesto(evento: PointerEvent): void {
    if (evento.pointerType !== 'touch') {
      return;
    }
    this.inicioX = evento.clientX;
    this.inicioY = evento.clientY;
  }

  protected finGesto(evento: PointerEvent): void {
    if (evento.pointerType !== 'touch') {
      return;
    }

    const dx = evento.clientX - this.inicioX;
    const dy = evento.clientY - this.inicioY;

    // Solo horizontal y con recorrido suficiente, para no chocar con el scroll.
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 2) {
      this.cambiarDia(dx < 0 ? 1 : -1);
    }
  }
}

function texto(...partes: ReadonlyArray<string | number | null | undefined>): string {
  const valor = partes
    .filter((parte) => parte !== null && parte !== undefined && parte !== '')
    .join(' ')
    .trim();
  return valor || '—';
}
