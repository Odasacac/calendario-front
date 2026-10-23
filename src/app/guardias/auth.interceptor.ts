import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { I18nService } from '../servicios/i18n.service';
import { NotificacionesService } from '../servicios/notificaciones.service';
import { UsuarioService } from '../servicios/usuario.service';

const RUTA_PRIVADA = `${environment.apiBaseUrl}/usuarios/me`;

/**
 * Añade el JWT solo a las rutas privadas de usuario (el resto de la API es
 * pública y no debe recibir el token). Si el back responde 401, la sesión ya
 * no vale: se cierra y se vuelve al login.
 */
export const authInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  if (!peticion.url.startsWith(RUTA_PRIVADA)) {
    return siguiente(peticion);
  }

  const usuarios = inject(UsuarioService);
  const router = inject(Router);
  const avisos = inject(NotificacionesService);
  const t = inject(I18nService).t;

  const token = usuarios.getToken();
  const conToken = token
    ? peticion.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : peticion;

  return siguiente(conToken).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && usuarios.esRegistrado()) {
        usuarios.cerrarSesion();
        avisos.error(t('sesion.caducada'));
        void router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
};
