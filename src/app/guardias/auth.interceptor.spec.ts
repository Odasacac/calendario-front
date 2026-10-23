import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../environments/environment';
import { UsuarioService } from '../servicios/usuario.service';
import { sesionDePrueba } from '../testing/datos-usuario';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let usuarios: UsuarioService;

  beforeEach(() => {
    sessionStorage.removeItem('vau.sesion');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    usuarios = TestBed.inject(UsuarioService);
    usuarios.iniciarSesion(sesionDePrueba());
  });

  afterEach(() => backend.verify());

  it('añade el token a las rutas privadas de usuario', () => {
    http.get(`${environment.apiBaseUrl}/usuarios/me`).subscribe();
    const peticion = backend.expectOne(`${environment.apiBaseUrl}/usuarios/me`);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    peticion.flush({});
  });

  it('no envía el token al resto de la API', () => {
    http.get(`${environment.apiBaseUrl}/conversiontovau/today`).subscribe();
    const peticion = backend.expectOne(`${environment.apiBaseUrl}/conversiontovau/today`);
    expect(peticion.request.headers.has('Authorization')).toBeFalse();
    peticion.flush({});
  });

  it('cierra la sesión y vuelve al login si el back responde 401', () => {
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    http.get(`${environment.apiBaseUrl}/usuarios/me`).subscribe({ error: () => undefined });
    backend
      .expectOne(`${environment.apiBaseUrl}/usuarios/me`)
      .flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(usuarios.esRegistrado()).toBeFalse();
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });
});
