/**
 * Utilidades de fecha en formato ISO `yyyy-MM-dd`.
 *
 * Todo el cálculo se hace en UTC: usar la hora local provocaba que al elegir
 * una fecha en el datepicker se guardase el día anterior en zonas con offset
 * negativo. `Date.UTC` mapea los años 0-99 al rango 1900-1999, por eso el año
 * se fija siempre con `setUTCFullYear`.
 */

const ISO = /^(\d{1,6})-(\d{1,2})-(\d{1,2})$/;

export function esFechaIso(valor: string | null | undefined): boolean {
  return !!valor && ISO.test(valor);
}

export function isoADate(iso: string): Date | null {
  const partes = ISO.exec(iso);
  if (!partes) {
    return null;
  }

  const [, anyo, mes, dia] = partes;
  const fecha = new Date(Date.UTC(2000, Number(mes) - 1, Number(dia)));
  fecha.setUTCFullYear(Number(anyo));

  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

export function dateAIso(fecha: Date): string {
  return [
    String(fecha.getUTCFullYear()).padStart(4, '0'),
    String(fecha.getUTCMonth() + 1).padStart(2, '0'),
    String(fecha.getUTCDate()).padStart(2, '0'),
  ].join('-');
}

/** Devuelve la fecha ISO desplazada `dias` días, o `null` si la entrada no es válida. */
export function sumarDias(iso: string, dias: number): string | null {
  const fecha = isoADate(iso);
  if (!fecha) {
    return null;
  }

  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return dateAIso(fecha);
}

/** Hoy según el calendario local del usuario (no según UTC). */
export function hoyIso(): string {
  const ahora = new Date();
  return [
    String(ahora.getFullYear()).padStart(4, '0'),
    String(ahora.getMonth() + 1).padStart(2, '0'),
    String(ahora.getDate()).padStart(2, '0'),
  ].join('-');
}

/** `31 de diciembre de 2025` / `31 December 2025`, según el locale. */
export function formatearFechaLarga(iso: string, locale: string): string {
  const fecha = isoADate(iso);
  if (!fecha) {
    return iso;
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(fecha);
  } catch {
    return formatearFechaCorta(iso);
  }
}

/** Nombre del día de la semana en el idioma activo. */
export function formatearDiaSemana(iso: string, locale: string): string {
  const fecha = isoADate(iso);
  if (!fecha) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      timeZone: 'UTC',
    }).format(fecha);
  } catch {
    return '';
  }
}

/** `dd-MM-yyyy`, formato compacto independiente del locale. */
export function formatearFechaCorta(iso: string): string {
  const partes = ISO.exec(iso);
  if (!partes) {
    return iso;
  }

  const [, anyo, mes, dia] = partes;
  return `${dia.padStart(2, '0')}-${mes.padStart(2, '0')}-${anyo.padStart(4, '0')}`;
}
