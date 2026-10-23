export type EstadoUsuario = 'ACTIVO' | 'INACTIVO' | 'SUSPENDIDO' | 'ELIMINADO';
export type RolUsuario = 'USER' | 'ADMIN';
export type MotivoSuspension = 'INACTIVIDAD' | 'USUARIO' | 'ADMINISTRADOR';

/** Perfil tal y como lo devuelve `/api/usuarios/me`. Las fechas llegan en ISO. */
export interface User {
  codigoUsuario: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  esMayorDeEdad: boolean;
  correo: string;
  estado: EstadoUsuario;
  rol: RolUsuario;
  fechaCreacion: string;
  fechaLastLogin: string | null;
}

export interface Sesion {
  token: string;
  expiraEn: string;
  /** `true` si este login ha levantado una suspensión hecha por el propio usuario. */
  reactivada: boolean;
  usuario: User;
}

export interface DatosRegistro {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  correo: string;
  contrasenya: string;
}

export interface DatosPerfil {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
}

/** Códigos de error estables de `/api/usuarios` (ver UsuarioException en el back). */
export type CodigoErrorUsuario =
  | 'CORREO_EXISTENTE'
  | 'CREDENCIALES_INVALIDAS'
  | 'DEMASIADOS_INTENTOS'
  | 'CUENTA_SUSPENDIDA'
  | 'CUENTA_ELIMINADA'
  | 'DATOS_RECUPERACION_INVALIDOS'
  | 'TOKEN_RECUPERACION_INVALIDO'
  | 'CONTRASENYAS_NO_COINCIDEN'
  | 'CONTRASENYA_ACTUAL_INCORRECTA'
  | 'CONTRASENYA_REPETIDA'
  | 'FECHA_NACIMIENTO_INVALIDA'
  | 'SESION_NO_VALIDA'
  | 'ACONTECIMIENTO_DUPLICADO'
  | 'ACONTECIMIENTO_NO_ENCONTRADO'
  | 'FECHA_FUERA_DE_RANGO'
  | 'VALIDACION'
  | 'ERROR_INTERNO';

export interface ErrorUsuario {
  codigo: CodigoErrorUsuario;
  mensaje: string;
  detalles: Readonly<Record<string, unknown>>;
}
