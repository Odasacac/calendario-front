import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { AcontecimientosService } from '../../../servicios/acontecimientos.service';
import { I18nService } from '../../../servicios/i18n.service';
import { UsuarioService } from '../../../servicios/usuario.service';
import { dateAIso, esFechaIso, hoyIso, isoADate } from '../../../utiles/fechas';
import { IconoComponent } from '../icono/icono.component';

/** Rango que admite la conversión a fecha VAU. */
const ANYO_MIN = 1;
const ANYO_MAX = 2099;

interface Dia {
  readonly iso: string;
  readonly numero: number;
  readonly delMes: boolean;
}

/**
 * Calendario mensual para elegir una fecha. Semana de lunes a domingo, todo
 * en UTC (como `utiles/fechas`) para no desplazar días por la zona horaria.
 *
 * Teclado: flechas para moverse entre días, Inicio/Fin para el principio o el
 * final de la semana, RePág/AvPág para cambiar de mes (con Mayús, de año) y
 * Intro o Espacio para elegir.
 */
@Component({
  selector: 'app-calendario',
  standalone: true,
  imports: [IconoComponent],
  templateUrl: './calendario.component.html',
  styleUrl: './calendario.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarioComponent implements OnInit, AfterViewInit {
  /** Fecha ISO marcada como elegida. */
  readonly seleccionada = input.required<string>();
  readonly seleccionar = output<string>();

  private readonly elemento = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly i18n = inject(I18nService);
  private readonly usuarios = inject(UsuarioService);
  private readonly acontecimientos = inject(AcontecimientosService);

  protected readonly t = this.i18n.t;
  protected readonly anyoMin = ANYO_MIN;
  protected readonly anyoMax = ANYO_MAX;
  protected readonly fechaMin = '0001-01-01';
  protected readonly fechaMax = '2099-12-31';
  protected readonly hoy = hoyIso();

  /** Día con el foco del teclado; también decide qué mes se ve. */
  protected readonly enfocada = signal(hoyIso());

  /** Días con acontecimiento destacado del usuario (vacío para invitados). */
  protected readonly conAcontecimiento = signal<ReadonlySet<string>>(new Set());

  protected readonly anyo = computed(() => isoADate(this.enfocada())!.getUTCFullYear());
  protected readonly mes = computed(() => isoADate(this.enfocada())!.getUTCMonth());

  protected readonly nombresMeses = computed(() => {
    const formato = new Intl.DateTimeFormat(this.i18n.locale(), { month: 'long', timeZone: 'UTC' });
    return Array.from({ length: 12 }, (_, mes) => formato.format(new Date(Date.UTC(2001, mes, 1))));
  });

  /** Iniciales de lunes a domingo (el 1 de enero de 2001 fue lunes). */
  protected readonly diasSemana = computed(() => {
    const corto = new Intl.DateTimeFormat(this.i18n.locale(), { weekday: 'short', timeZone: 'UTC' });
    const largo = new Intl.DateTimeFormat(this.i18n.locale(), { weekday: 'long', timeZone: 'UTC' });
    return Array.from({ length: 7 }, (_, i) => {
      const fecha = new Date(Date.UTC(2001, 0, 1 + i));
      return { corto: corto.format(fecha).replace('.', ''), largo: largo.format(fecha) };
    });
  });

  /** Siempre 6 semanas, para que el calendario no cambie de alto entre meses. */
  protected readonly semanas = computed<readonly (readonly Dia[])[]>(() => {
    const primero = fechaUtc(this.anyo(), this.mes(), 1);
    const desfase = (primero.getUTCDay() + 6) % 7;
    const inicio = new Date(primero);
    inicio.setUTCDate(1 - desfase);

    const semanas: Dia[][] = [];
    for (let s = 0; s < 6; s++) {
      const semana: Dia[] = [];
      for (let d = 0; d < 7; d++) {
        const dia = new Date(inicio);
        dia.setUTCDate(inicio.getUTCDate() + s * 7 + d);
        semana.push({
          iso: dateAIso(dia),
          numero: dia.getUTCDate(),
          delMes: dia.getUTCMonth() === this.mes(),
        });
      }
      semanas.push(semana);
    }
    return semanas;
  });

  protected readonly anteriorDeshabilitado = computed(
    () => this.anyo() <= ANYO_MIN && this.mes() === 0,
  );
  protected readonly siguienteDeshabilitado = computed(
    () => this.anyo() >= ANYO_MAX && this.mes() === 11,
  );

  ngOnInit(): void {
    this.enfocada.set(this.seleccionada());

    if (this.usuarios.esRegistrado()) {
      this.acontecimientos.fechas().subscribe({
        next: (fechas) => this.conAcontecimiento.set(new Set(fechas)),
        error: () => {
          /* sin marcas: el calendario sigue funcionando */
        },
      });
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.enfocarDia());
  }

  protected etiquetaDia(dia: Dia): string {
    const fecha = new Intl.DateTimeFormat(this.i18n.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(isoADate(dia.iso)!);
    return this.conAcontecimiento().has(dia.iso)
      ? `${fecha}. ${this.t('calendario.tieneAcontecimiento')}`
      : fecha;
  }

  protected elegir(iso: string): void {
    if (!enRango(iso)) {
      return;
    }
    this.enfocada.set(iso);
    this.seleccionar.emit(iso);
  }

  protected cambiarMes(meses: number): void {
    this.moverA(sumarMeses(this.enfocada(), meses));
  }

  protected irAHoy(): void {
    this.elegir(this.hoy);
  }

  protected cambiarMesDesdeSelector(evento: Event): void {
    const mes = Number((evento.target as HTMLSelectElement).value);
    this.moverA(conMesYAnyo(this.enfocada(), mes, this.anyo()));
  }

  protected cambiarAnyoDesdeCampo(evento: Event): void {
    const anyo = Number((evento.target as HTMLInputElement).value);
    if (Number.isInteger(anyo) && anyo >= ANYO_MIN && anyo <= ANYO_MAX) {
      this.moverA(conMesYAnyo(this.enfocada(), this.mes(), anyo));
    }
  }

  protected escribirFecha(evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value;
    if (esFechaIso(valor) && enRango(valor)) {
      this.elegir(valor);
    }
  }

  protected teclaEnDia(evento: KeyboardEvent): void {
    const actual = this.enfocada();
    let destino: string | null = null;

    switch (evento.key) {
      case 'ArrowLeft':
        destino = sumarDiasIso(actual, -1);
        break;
      case 'ArrowRight':
        destino = sumarDiasIso(actual, 1);
        break;
      case 'ArrowUp':
        destino = sumarDiasIso(actual, -7);
        break;
      case 'ArrowDown':
        destino = sumarDiasIso(actual, 7);
        break;
      case 'Home':
        destino = sumarDiasIso(actual, -((isoADate(actual)!.getUTCDay() + 6) % 7));
        break;
      case 'End':
        destino = sumarDiasIso(actual, 6 - ((isoADate(actual)!.getUTCDay() + 6) % 7));
        break;
      case 'PageUp':
        destino = sumarMeses(actual, evento.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        destino = sumarMeses(actual, evento.shiftKey ? 12 : 1);
        break;
      case 'Enter':
      case ' ':
        evento.preventDefault();
        this.elegir(actual);
        return;
      default:
        return;
    }

    evento.preventDefault();
    // Que la fecha VAU no reciba también las flechas y cambie de día.
    evento.stopPropagation();
    this.moverA(destino, true);
  }

  private moverA(iso: string, enfocar = false): void {
    if (!enRango(iso)) {
      return;
    }
    this.enfocada.set(iso);
    if (enfocar) {
      setTimeout(() => this.enfocarDia());
    }
  }

  private enfocarDia(): void {
    this.elemento.nativeElement
      .querySelector<HTMLButtonElement>(`[data-dia="${this.enfocada()}"]`)
      ?.focus();
  }
}

/**
 * `setUTCFullYear` con mes y día calcula el desbordamiento en el año real (el
 * día 0 de marzo es el 28 o 29 de febrero según toque) y, a diferencia de
 * `Date.UTC`, no convierte los años 0-99 en 1900-1999.
 */
function fechaUtc(anyo: number, mes: number, dia: number): Date {
  const fecha = new Date(0);
  fecha.setUTCFullYear(anyo, mes, dia);
  return fecha;
}

function enRango(iso: string): boolean {
  const anyo = isoADate(iso)?.getUTCFullYear() ?? 0;
  return anyo >= ANYO_MIN && anyo <= ANYO_MAX;
}

function sumarDiasIso(iso: string, dias: number): string {
  const fecha = isoADate(iso)!;
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return dateAIso(fecha);
}

/** Mismo día en otro mes; si no existe (31 de abril), el último día de ese mes. */
function sumarMeses(iso: string, meses: number): string {
  const fecha = isoADate(iso)!;
  const total = fecha.getUTCMonth() + meses;
  const anyo = fecha.getUTCFullYear() + Math.floor(total / 12);
  const mes = ((total % 12) + 12) % 12;
  return conMesYAnyo(iso, mes, anyo);
}

function conMesYAnyo(iso: string, mes: number, anyo: number): string {
  const dia = isoADate(iso)!.getUTCDate();
  const ultimo = fechaUtc(anyo, mes + 1, 0).getUTCDate();
  return dateAIso(fechaUtc(anyo, mes, Math.min(dia, ultimo)));
}
