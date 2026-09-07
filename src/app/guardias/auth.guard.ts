import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UsuarioService } from '../servicios/usuario.service';

/**
 * Protege las rutas privadas. Sustituye a la comprobación que hacía
 * `HomeComponent` en `ngOnInit`, de modo que la ruta ni se carga si no hay
 * sesión (el componente perezoso tampoco se descarga).
 */
export const authGuard: CanActivateFn = () => {
  const usuarios = inject(UsuarioService);
  const router = inject(Router);

  if (usuarios.estaAutenticado()) {
    return true;
  }

  return router.createUrlTree(['/forbidden']);
};
