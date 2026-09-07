import { Routes } from '@angular/router';
import { authGuard } from './guardias/auth.guard';

/**
 * Todas las rutas cargan su componente de forma perezosa: el bundle inicial
 * solo lleva el login, que es la primera pantalla.
 *
 * `title` no es un texto sino una clave de traducción; la resuelve
 * `TituloTraducidoStrategy`.
 */
export const routes: Routes = [
  {
    path: 'login',
    title: 'login.titulo',
    loadComponent: () =>
      import('./componentes/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./componentes/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'recovery',
    title: 'recuperar.titulo',
    loadComponent: () =>
      import('./componentes/recovery/recovery.component').then(
        (m) => m.RecoveryComponent,
      ),
  },
  {
    path: 'register',
    title: 'registro.titulo',
    loadComponent: () =>
      import('./componentes/registro/registro.component').then(
        (m) => m.RegistroComponent,
      ),
  },
  {
    path: 'forbidden',
    title: 'prohibido.titulo',
    loadComponent: () =>
      import('./componentes/forbidden/forbidden.component').then(
        (m) => m.ForbiddenComponent,
      ),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: '**',
    title: 'noEncontrado.titulo',
    loadComponent: () =>
      import('./componentes/no-encontrado/no-encontrado.component').then(
        (m) => m.NoEncontradoComponent,
      ),
  },
];
