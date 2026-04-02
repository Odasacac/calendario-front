export interface VAUResponse {
  absoluteEclipses: {
    lunarSinceLastEclipenoIN: number;
    lunarSinceLastMetonoIN: number;
    sinceLastEclipenoIN: number;
    sinceLastMetonoIN: number;
    solarSinceLastEclipenoIN: number;
    solarSinceLastMetonoIN: number;
  };

  casalero: {
    bicuartal: boolean;
    cuartal: boolean;
    dateO: string;
    deLuna: boolean;
    deSol: boolean;
    inicial: boolean;
    lleno: boolean;
    nuevo: boolean;
    tipo: string;
    tricuartal: boolean;
  } | null;

  day: string;

  eclipenoIN: {
    eclipenoINDay: boolean;
    yearOfCurrentEclipenoIN: number;
  };

  metonoIN: {
    metonoINDay: boolean;
    metonosINSinceLastEclipenoIN: number;
    numberOfMeton: number;
    yearOfCurrentMetonIN: number;
  };

  month: {
    name: string;
    newMoon: boolean;
  };

  notableEvent: {
    today: string | null;
    next: string | null;
    previous: string | null
  };

  week: string;

  year: {
    esSolsticioDeInvierno: boolean;
    numberOfYear: number;
    solsticiosDeInviernoSinceLastMetonIN: number;
  };
}