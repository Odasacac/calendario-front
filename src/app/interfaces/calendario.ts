/** Contratos de `/api/calendario` (ver LunacionDTO y compañía en el back). Fechas en `yyyy-MM-dd`. */

export interface DiaCalendario {
  fecha: string;
  /** Luna nueva: va en la fila Terra, fuera de la rejilla de semanas. */
  terra: boolean;
  /** 1 (Primana) a 5 (Limana); `null` en Terra o sin datos. */
  semana: number | null;
  /** 0 a 6; Limana reutiliza las primeras columnas. */
  columna: number | null;
  dia: string | null;
  apellidoDia: string | null;
  mes: string | null;
  /** 1 invierno … 4 otoño; 0 el día del solsticio o equinoccio. */
  estacion: number;
  festividad: string | null;
  evento: string | null;
  eventoResenyable: boolean;
  eclipse: boolean;
  sinDatos: boolean;
}

export interface MesLunacion {
  nombre: string;
  apellido: string | null;
  estacion: number;
}

export interface Lunacion {
  inicio: string;
  fin: string;
  dias: DiaCalendario[];
  meses: MesLunacion[];
  estaciones: number[];
  /** Nombre de cada semana por número (0 = Terra). */
  semanas: string[];
  /** De Luno a Saturino. */
  diasSemana: string[];
  anyo: string | null;
  anyoFinal: string | null;
  metono: number | null;
  apellidoMetono: string | null;
  cambioDeAnyo: string | null;
  /** Un día de la lunación anterior / siguiente; `null` fuera del rango navegable. */
  anterior: string | null;
  siguiente: string | null;
}

export interface MetonoIndice {
  id: number;
  numero: number;
  apellido: string | null;
  inicio: string;
  fin: string | null;
}

export interface AnyoIndice {
  numero: number;
  inicio: string;
  fin: string;
}

export interface MesIndice {
  nombre: string;
  apellido: string | null;
  fecha: string;
}
