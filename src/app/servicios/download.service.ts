import { HttpClient, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { CalendarByYearDTO } from '../interfaces/calendar-by-year-dto';

export interface FicheroDescargado {
  readonly blob: Blob;
  readonly nombre: string;
}

@Injectable({ providedIn: 'root' })
export class DownloadService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  getPDF(): Observable<FicheroDescargado> {
    return this.http
      .get(`${this.apiUrl}/getpdf`, { responseType: 'blob', observe: 'response' })
      .pipe(map((respuesta) => aFichero(respuesta, 'manual-calendario-vau.pdf')));
  }

  getCalendarForAYear(dto: CalendarByYearDTO): Observable<FicheroDescargado> {
    return this.http
      .post(`${this.apiUrl}/getcalendar`, dto, {
        responseType: 'blob',
        observe: 'response',
      })
      .pipe(
        map((respuesta) =>
          aFichero(respuesta, `calendario-vau-${dto.numberOfYear}.pdf`),
        ),
      );
  }

  /**
   * Lanza la descarga en el navegador. El `objectURL` se libera en el
   * siguiente tick, cuando el navegador ya ha tomado el contenido.
   */
  guardar(fichero: FicheroDescargado): void {
    const url = URL.createObjectURL(fichero.blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = fichero.nombre;
    enlace.rel = 'noopener';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/** Respeta el nombre que envía el backend en `Content-Disposition` si lo hay. */
function aFichero(
  respuesta: HttpResponse<Blob>,
  nombrePorDefecto: string,
): FicheroDescargado {
  const disposition = respuesta.headers.get('Content-Disposition') ?? '';
  const coincidencia =
    /filename\*=UTF-8''([^;]+)/i.exec(disposition) ??
    /filename="?([^";]+)"?/i.exec(disposition);

  let nombre = nombrePorDefecto;
  if (coincidencia?.[1]) {
    try {
      nombre = decodeURIComponent(coincidencia[1].trim());
    } catch {
      nombre = coincidencia[1].trim();
    }
  }

  return { blob: respuesta.body ?? new Blob(), nombre };
}
