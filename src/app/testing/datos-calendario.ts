import { DiaCalendario, Lunacion } from '../interfaces/calendario';
import { dateAIso, isoADate } from '../utiles/fechas';

const DIAS = ['Luno', 'Sole', 'Merco', 'Venuro', 'Marto', 'Júpeno', 'Saturino'];

/** Lunación de ejemplo: Terra + 4 semanas + Liminol (30 días) desde `inicio`. */
export function lunacionDePrueba(inicio = '2026-10-10', cambios: Partial<Lunacion> = {}): Lunacion {
  const dias: DiaCalendario[] = [];
  const fecha = isoADate(inicio)!;
  const siguiente = (): string => {
    const iso = dateAIso(fecha);
    fecha.setUTCDate(fecha.getUTCDate() + 1);
    return iso;
  };

  dias.push(dia(siguiente(), { terra: true, dia: 'Terra', evento: 'Luna nueva' }));
  for (let semana = 1; semana <= 4; semana++) {
    for (let columna = 0; columna < 7; columna++) {
      dias.push(dia(siguiente(), { semana, columna, dia: DIAS[columna] }));
    }
  }
  dias.push(dia(siguiente(), { semana: 5, columna: 0, dia: 'Liminol' }));

  const fin = dias[dias.length - 1].fecha;
  const anterior = isoADate(inicio)!;
  anterior.setUTCDate(anterior.getUTCDate() - 1);
  const posterior = isoADate(fin)!;
  posterior.setUTCDate(posterior.getUTCDate() + 1);

  return {
    inicio,
    fin,
    dias,
    meses: [{ nombre: 'Pridor', apellido: null, estacion: 4 }],
    estaciones: [4],
    semanas: ['Terra', 'Primana', 'Segana', 'Terana', 'Curana', 'Limana'],
    diasSemana: DIAS,
    anyo: '11',
    anyoFinal: '11',
    metono: 43,
    apellidoMetono: null,
    cambioDeAnyo: null,
    anterior: dateAIso(anterior),
    siguiente: dateAIso(posterior),
    ...cambios,
  };
}

function dia(fecha: string, cambios: Partial<DiaCalendario>): DiaCalendario {
  return {
    fecha,
    terra: false,
    semana: null,
    columna: null,
    dia: null,
    apellidoDia: null,
    mes: 'Pridor',
    estacion: 4,
    festividad: null,
    evento: null,
    eventoResenyable: false,
    eclipse: false,
    sinDatos: false,
    ...cambios,
  };
}
