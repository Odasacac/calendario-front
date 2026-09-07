import { dateAIso, formatearFechaCorta, isoADate, sumarDias } from './fechas';

describe('utiles/fechas', () => {
  it('conserva los años de dos cifras en lugar de mapearlos a 19xx', () => {
    const fecha = isoADate('0045-03-10');
    expect(fecha?.getUTCFullYear()).toBe(45);
  });

  it('suma días cruzando el cambio de mes y de año', () => {
    expect(sumarDias('2024-02-28', 1)).toBe('2024-02-29');
    expect(sumarDias('2024-12-31', 1)).toBe('2025-01-01');
    expect(sumarDias('2025-01-01', -1)).toBe('2024-12-31');
  });

  it('devuelve null si la entrada no es una fecha ISO', () => {
    expect(sumarDias('no-es-fecha', 1)).toBeNull();
    expect(isoADate('31-12-2025')).toBeNull();
  });

  it('rellena el año con ceros a la izquierda al serializar', () => {
    const fecha = isoADate('0001-01-02');
    expect(fecha).not.toBeNull();
    expect(dateAIso(fecha!)).toBe('0001-01-02');
  });

  it('formatea en dd-MM-yyyy', () => {
    expect(formatearFechaCorta('2025-09-07')).toBe('07-09-2025');
  });
});
