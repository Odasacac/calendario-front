import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { DatosAcontecimiento, Acontecimiento } from '../interfaces/acontecimiento';

/** CRUD de `/api/usuarios/me/acontecimientos`. El token lo añade `authInterceptor`. */
@Injectable({ providedIn: 'root' })
export class AcontecimientosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/usuarios/me/acontecimientos`;

  /** Del más reciente al más antiguo. */
  listar(): Observable<Acontecimiento[]> {
    return this.http.get<Acontecimiento[]>(this.apiUrl);
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
