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
    estival: boolean;
    primaveral: boolean;
    dateO: string;
    deLuna: boolean;
    deSol: boolean;
    invernal: boolean;
    lleno: boolean;
    nuevo: boolean;
    tipo: string;
    otonyal: boolean;
  } | null;

  day: string;

  eclipenoVAU: {
      eclipenoINDay : boolean;
      eclipenosINSinceLastEclipenoINSelecto: number;
      numberOfEclipenoIN: number;
      yearOfCurrentEclipenoIN: number;
      lastEclipenoSurname: string;
  }

  lastEclipenoSelecto: {
    eclipenoINSelectoDay: boolean;
    daysSinceCurrentEclipenoSelectoIN: string;
  };

  metonoInvernalApofasalRemoto:{
    metonoInvernalApofasalRemotoDay: boolean;
	  yearOfCurrentMetonoInvernalApofasalRemoto: number;
	  metonosInvernalApofasalRemotoSinceLastEclipenoINSelecto: number;
	  numberOfMetonoInvernalApofasalRemoto: number;
  }

  metonoVAU:{
    metonsIN: {
      metonoINDay: boolean;
      metonosINSinceLastEclipenoIN: number;
      numberOfMetonIN: number;
      yearOfCurrentMetonIN: number;
      lastMetonSurname: string;
    }
    metonsIA:{
      metonoIADay: boolean;
      metonosIASinceLastEclipenoSelecto: number;
      numberOfMetonIA: number;
      yearOfCurrentMetonIA: number;
      lastMetonSurname: string;
    }
  
  };

  month: {
    name: string;
    newMoon: boolean;
    surname: string;
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

  festividades:{
    festividadActual: string | null;
    festividadAnterior: string | null;
    festividadProxima: string | null;
  }

  estadoLuna:{
    comportamientoLunaDTO:{
        date: string | null;
        direccion: string | null;
    } 
  }
}