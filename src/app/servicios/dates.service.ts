import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, retry, shareReplay, throwError, timer } from 'rxjs';
import { environment } from '../../environments/environment';
import { VAUResponse } from '../interfaces/vau-response';

/** Fechas distintas que se mantienen en memoria antes de descartar las más viejas. */
const MAX_CACHE = 60;

@Injectable({ providedIn: 'root' })
export class DatesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/conversiontovau`;

  /** Cache en memoria: navegar con las flechas y volver no repite la llamada. */
  private readonly cache = new Map<string, Observable<VAUResponse>>();

  getVAU(fecha: string): Observable<VAUResponse> {
    const enCache = this.cache.get(fecha);
    if (enCache) {
      return enCache;
    }

    const peticion = this.http
      .get<VAUResponse>(`${this.apiUrl}/selected`, {
        params: new HttpParams().set('date', fecha),
      })
      .pipe(
        reintentos(),
        // Un fallo no debe quedarse cacheado: así el botón de reintentar vuelve a llamar.
        catchError((error: unknown) => {
          this.cache.delete(fecha);
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    if (this.cache.size >= MAX_CACHE) {
      const masAntigua = this.cache.keys().next();
      if (!masAntigua.done) {
        this.cache.delete(masAntigua.value);
      }
    }

    this.cache.set(fecha, peticion);
    return peticion;
  }

  /** Hoy no se cachea: el día puede cambiar mientras la app sigue abierta. */
  getTodayVAU(): Observable<VAUResponse> {
    return this.http.get<VAUResponse>(`${this.apiUrl}/today`).pipe(reintentos());
  }

  limpiarCache(): void {
    this.cache.clear();
  }
}

/** Dos reintentos con espera creciente para absorber cortes puntuales de red. */
function reintentos() {
  return retry<VAUResponse>({
    count: 2,
    delay: (_error, intento) => timer(intento * 400),
  });
}
