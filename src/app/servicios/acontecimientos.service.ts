import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { Acontecimiento, DatosAcontecimiento, Pagina } from '../interfaces/acontecimiento';

/** CRUD de `/api/usuarios/me/acontecimientos`. El token lo añade `authInterceptor`. */
@Injectable({ providedIn: 'root' })
export class AcontecimientosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/usuarios/me/acontecimientos`;

  /** Una página, del más reciente al más antiguo. `pagina` empieza en 0. */
  listar(pagina: number, tamanyo: number): Observable<Pagina<Acontecimiento>> {
    const params = new HttpParams().set('pagina', pagina).set('tamanyo', tamanyo);
    return this.http.get<Pagina<Acontecimiento>>(this.apiUrl, { params });
  }

  /** Todas las fechas con acontecimiento (para marcar días en los calendarios). */
  fechas(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/fechas`);
  }

  /** Acontecimiento de ese día, o `null` si no hay (el back responde 204). */
  porFecha(fecha: string): Observable<Acontecimiento | null> {
    return this.http
      .get<Acontecimiento>(`${this.apiUrl}/fecha/${fecha}`, { observe: 'response' })
      .pipe(map((respuesta) => respuesta.body ?? null));
  }

  crear(datos: DatosAcontecimiento): Observable<Acontecimiento> {
    return this.http.post<Acontecimiento>(this.apiUrl, datos);
  }

  modificar(id: number, datos: DatosAcontecimiento): Observable<Acontecimiento> {
    return this.http.put<Acontecimiento>(`${this.apiUrl}/${id}`, datos);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
