import { Sesion, User } from '../interfaces/user';

/** Datos de ejemplo compartidos por los tests de usuario. */
export function usuarioDePrueba(cambios: Partial<User> = {}): User {
  return {
    codigoUsuario: 'ccasado',
    nombre: 'Carlos',
    apellido: 'Casado',
    fechaNacimiento: '1993-05-10',
    esMayorDeEdad: true,
    correo: 'carlos@vau.com',
    estado: 'ACTIVO',
    rol: 'USER',
    fechaCreacion: '2026-01-01T10:00:00',
    fechaLastLogin: '2026-10-23T09:00:00',
    ...cambios,
  };
}

export function sesionDePrueba(cambios: Partial<Sesion> = {}): Sesion {
  return {
    token: 'token-de-prueba',
    expiraEn: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    reactivada: false,
    usuario: usuarioDePrueba(),
    ...cambios,
  };
}
