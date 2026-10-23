import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { esFechaIso, hoyIso } from './fechas';

export const EMAIL = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

/** Igual que `PoliticaContrasenya` del back: 8-64 caracteres sin espacios, con letra y número. */
export const CONTRASENYA = /^(?=.*\p{L})(?=.*\d)\S{8,64}$/u;

/** Buzones a los que se dirigen las peticiones que se resuelven a mano. */
export const CORREO_SOPORTE = 'carloscasadoaguilera@vaucalendar.com';
export const CORREO_REACTIVACION = 'carloscasadoaguilera@gmail.com';

/**
 * Validador de grupo: marca `noCoinciden` si los dos campos difieren. Solo
 * opina cuando el segundo ya tiene valor, para no gritar mientras se escribe.
 */
export function coincidenValidator(campo: string, repeticion: string): ValidatorFn {
  return (grupo: AbstractControl): ValidationErrors | null => {
    const valor = grupo.get(campo)?.value as unknown;
    const repetido = grupo.get(repeticion)?.value as unknown;
    return repetido && valor !== repetido ? { noCoinciden: true } : null;
  };
}

/** Fecha `yyyy-MM-dd` anterior a hoy y posterior a 1900. */
export function fechaNacimientoValidator(control: AbstractControl): ValidationErrors | null {
  const valor = control.value as string;
  if (!valor) {
    return null;
  }
  return esFechaIso(valor) && valor >= '1900-01-01' && valor < hoyIso()
    ? null
    : { fechaInvalida: true };
}
