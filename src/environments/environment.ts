/**
 * Configuración usada en los builds de producción.
 * Se sirve la API en el mismo origen (usar un reverse proxy hacia el backend).
 */
export const environment = {
  production: true,
  apiBaseUrl: '/api',
} as const;
