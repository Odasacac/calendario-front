import { TestBed } from '@angular/core/testing';
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
  });

  it('marca como autenticado al entrar como invitado', () => {
    service.setEsInvitado(true);
    expect(service.esInvitado()).toBeTrue();
    expect(service.estaAutenticado()).toBeTrue();
  });

  it('limpia la sesión al cerrarla', () => {
    service.setUsuario({ nombre: 'Carlos' });
    expect(service.estaAutenticado()).toBeTrue();
    service.cerrarSesion();
    expect(service.estaAutenticado()).toBeFalse();
  });
});
