import { ErrorUsuario } from '../interfaces/user';
import { I18nService } from '../servicios/i18n.service';

type Traductor = I18nService['t'];

/**
 * Mensaje para los errores que cualquier pantalla de usuario trata igual:
 * sin respuesta del servidor, bloqueo por intentos o error inesperado.
 */
export function mensajeErrorComun(error: ErrorUsuario | null, t: Traductor): string {
  if (error === null) {
    return t('comun.errorServidor');
  }
  if (error.codigo === 'DEMASIADOS_INTENTOS') {
    return t('comun.bloqueado', { min: Number(error.detalles['minutosRestantes'] ?? 15) });
  }
  return t('comun.errorInesperado');
}

/** Añade «Te quedan N intentos» si el back lo indica y aún quedan. */
export function conIntentos(mensaje: string, error: ErrorUsuario, t: Traductor): string {
  const restantes = Number(error.detalles['intentosRestantes']);
  return restantes > 0 ? `${mensaje} ${t('comun.intentosRestantes', { n: restantes })}` : mensaje;
}
