import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AnyoIndice, Lunacion, MesIndice, MetonoIndice } from '../interfaces/calendario';
import { dateAIso, isoADate } from '../utiles/fechas';

/** Lunaciones guardadas en memoria antes de olvidar las más antiguas. */
const MAX_LUNACIONES = 60;

/**
 * Calendario VAU por lunaciones. Todo se guarda en memoria: una lunación no
 * cambia, y al tenerla indexada por cada uno de sus días, pedir cualquier
 * fecha de una lunación ya vista (o precargada) es instantáneo.
 */
@Injectable({ providedIn: 'root' })
export class CalendarioService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/calendario`;

  /** Fecha -> lunación que la contiene (o la petición en curso). */
  private readonly porFecha = new Map<string, Observable<Lunacion>>();
  /** Inicio de cada lunación -> sus fechas, en orden de llegada (para olvidar las más antiguas). */
  private readonly fechasPorLunacion = new Map<string, string[]>();

  private metonosCache?: Observable<MetonoIndice[]>;
  private readonly anyosCache = new Map<number, Observable<AnyoIndice[]>>();
  private readonly mesesCache = new Map<string, Observable<MesIndice[]>>();

  lunacion(fecha: string): Observable<Lunacion> {
    const enCache = this.porFecha.get(fecha);
    if (enCache) {
      return enCache;
    }

    const peticion = this.http
      .get<Lunacion>(`${this.apiUrl}/lunacion`, { params: new HttpParams().set('fecha', fecha) })
      .pipe(
        tap((lunacion) => this.indexar(lunacion, peticion)),
        catchError((error: unknown) => {
          this.porFecha.delete(fecha);
          return throwError(() => error);
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.porFecha.set(fecha, peticion);
    return peticion;
  }

  /** Pide en segundo plano las lunaciones vecinas para que pasar de mes sea inmediato. */
  precargarVecinas(lunacion: Lunacion): void {
    for (const fecha of [lunacion.anterior, lunacion.siguiente]) {
      if (fecha && !this.porFecha.has(fecha)) {
        this.lunacion(fecha).subscribe({ error: () => undefined });
      }
    }
  }

  metonos(): Observable<MetonoIndice[]> {
    this.metonosCache ??= this.cacheado(this.http.get<MetonoIndice[]>(`${this.apiUrl}/metonos`), () => {
      this.metonosCache = undefined;
    });
    return this.metonosCache;
  }

  anyos(idMetono: number): Observable<AnyoIndice[]> {
    let anyos = this.anyosCache.get(idMetono);
    if (!anyos) {
      anyos = this.cacheado(this.http.get<AnyoIndice[]>(`${this.apiUrl}/metonos/${idMetono}/anyos`), () =>
        this.anyosCache.delete(idMetono),
      );
      this.anyosCache.set(idMetono, anyos);
    }
    return anyos;
  }

  meses(anyo: AnyoIndice): Observable<MesIndice[]> {
    let meses = this.mesesCache.get(anyo.inicio);
    if (!meses) {
      const params = new HttpParams().set('inicio', anyo.inicio).set('fin', anyo.fin);
      meses = this.cacheado(this.http.get<MesIndice[]>(`${this.apiUrl}/meses`, { params }), () =>
        this.mesesCache.delete(anyo.inicio),
      );
      this.mesesCache.set(anyo.inicio, meses);
    }
    return meses;
  }

  /** Registra la lunación bajo cada uno de sus días. */
  private indexar(lunacion: Lunacion, peticion: Observable<Lunacion>): void {
    const fechas: string[] = [];
    const fin = isoADate(lunacion.fin);
    for (let dia = isoADate(lunacion.inicio); dia && fin && dia <= fin; dia.setUTCDate(dia.getUTCDate() + 1)) {
      const iso = dateAIso(dia);
      fechas.push(iso);
      this.porFecha.set(iso, peticion);
    }
    this.fechasPorLunacion.set(lunacion.inicio, fechas);

    while (this.fechasPorLunacion.size > MAX_LUNACIONES) {
      const [antigua, suyas] = this.fechasPorLunacion.entries().next().value as [string, string[]];
      suyas.forEach((fecha) => this.porFecha.delete(fecha));
      this.fechasPorLunacion.delete(antigua);
    }
  }

  /** Comparte la respuesta y la olvida si falla, para poder reintentar. */
  private cacheado<T>(peticion: Observable<T>, alFallar: () => void): Observable<T> {
    return peticion.pipe(
      catchError((error: unknown) => {
        alFallar();
        return throwError(() => error);
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
  }
}
