import { TestBed } from '@angular/core/testing';
import { sesionDePrueba, usuarioDePrueba } from '../testing/datos-usuario';
import { UsuarioService } from './usuario.service';

describe('UsuarioService', () => {
  let service: UsuarioService;

  beforeEach(() => {
    sessionStorage.removeItem('vau.sesion');
    TestBed.configureTestingModule({});
    service = TestBed.inject(UsuarioService);
  });

  it('arranca sin sesión', () => {
    expect(service.estaAutenticado()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('marca como autenticado al entrar como invitado', () => {
    service.setEsInvitado(true);
    expect(service.esInvitado()).toBeTrue();
    expect(service.esRegistrado()).toBeFalse();
    expect(service.estaAutenticado()).toBeTrue();
  });

  it('guarda usuario y token al iniciar sesión', () => {
    service.iniciarSesion(sesionDePrueba());
    expect(service.esRegistrado()).toBeTrue();
    expect(service.usuario()?.nombre).toBe('Carlos');
    expect(service.getToken()).toBe('token-de-prueba');
  });

  it('limpia la sesión al cerrarla', () => {
    service.iniciarSesion(sesionDePrueba());
    service.cerrarSesion();
    expect(service.estaAutenticado()).toBeFalse();
    expect(service.getToken()).toBeNull();
  });

  it('cierra la sesión si el token ha caducado', () => {
    service.iniciarSesion(sesionDePrueba({ expiraEn: new Date(Date.now() - 1000).toISOString() }));
    expect(service.getToken()).toBeNull();
    expect(service.esRegistrado()).toBeFalse();
  });

  it('actualiza el perfil sin perder el token', () => {
    service.iniciarSesion(sesionDePrueba());
    service.actualizarUsuario(usuarioDePrueba({ nombre: 'Lucía' }));
    expect(service.usuario()?.nombre).toBe('Lucía');
    expect(service.getToken()).toBe('token-de-prueba');
  });
});
