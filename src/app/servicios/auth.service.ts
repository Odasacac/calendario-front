import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DatosPerfil, DatosRegistro, ErrorUsuario, Sesion, User } from '../interfaces/user';

/** Llamadas a `/api/usuarios`. El token lo añade `authInterceptor`. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/usuarios`;

  registrar(datos: DatosRegistro): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.apiUrl}/registro`, datos);
  }

  /** `identificador` puede ser el correo o el código de usuario. */
  login(identificador: string, contrasenya: string): Observable<Sesion> {
    return this.http.post<Sesion>(`${this.apiUrl}/login`, { identificador, contrasenya });
  }

  verificarRecuperacion(codigoUsuario: string, correo: string): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/recuperacion/verificar`, {
      codigoUsuario,
      correo,
    });
  }

  restablecerContrasenya(token: string, nueva: string, confirmacion: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/recuperacion/restablecer`, {
      token,
      nueva,
      confirmacion,
    });
  }

  perfil(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  editarPerfil(datos: DatosPerfil): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/me`, datos);
  }

  cambiarContrasenya(actual: string, nueva: string): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/me/contrasenya`, { actual, nueva });
  }

  suspenderCuenta(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/me/suspender`, {});
  }

  eliminarCuenta(contrasenya: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/me/eliminar`, { contrasenya });
  }
}

/** Extrae el `{codigo, mensaje, detalles}` del back; `null` si no hubo respuesta (servidor caído, red...). */
export function errorUsuario(error: unknown): ErrorUsuario | null {
  if (error instanceof HttpErrorResponse && error.error && typeof error.error === 'object') {
    const cuerpo = error.error as Partial<ErrorUsuario>;
    if (typeof cuerpo.codigo === 'string') {
      return {
        codigo: cuerpo.codigo,
        mensaje: cuerpo.mensaje ?? '',
        detalles: cuerpo.detalles ?? {},
      };
    }
  }
  return null;
}
