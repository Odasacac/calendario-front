import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { UsuarioService } from '../../servicios/usuario.service';
import { sesionDePrueba } from '../../testing/datos-usuario';
import { LoginComponent } from './login.component';

const URL_LOGIN = `${environment.apiBaseUrl}/usuarios/login`;

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let elemento: HTMLElement;
  let backend: HttpTestingController;

  function escribir(id: string, valor: string): void {
    const input = elemento.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  function entrar(usuario = 'ccasado', contrasenya = 'secreta123'): void {
    escribir('user', usuario);
    escribir('password', contrasenya);
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));
  }

  function responderError(status: number, cuerpo: object): void {
    backend.expectOne(URL_LOGIN).flush(cuerpo, { status, statusText: 'Error' });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.removeItem('vau.sesion');
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    elemento = fixture.nativeElement as HTMLElement;
    backend = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  afterEach(() => backend.verify());

  it('se crea', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('no envía nada con el formulario vacío', () => {
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    backend.expectNone(URL_LOGIN);
    expect(elemento.querySelectorAll('.field-error').length).toBe(2);
  });

  it('inicia sesión con correo o código de usuario y va al home', () => {
    entrar(' ccasado ');
    const peticion = backend.expectOne(URL_LOGIN);
    expect(peticion.request.body).toEqual({ identificador: 'ccasado', contrasenya: 'secreta123' });
    peticion.flush(sesionDePrueba());

    expect(TestBed.inject(UsuarioService).usuario()?.nombre).toBe('Carlos');
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/home']);
  });

  it('muestra los intentos que quedan si la contraseña es incorrecta', () => {
    entrar();
    responderError(401, {
      codigo: 'CREDENCIALES_INVALIDAS',
      mensaje: '',
      detalles: { intentosRestantes: 2 },
    });

    const alerta = elemento.querySelector('[role="alert"]')!.textContent!;
    expect(alerta).toContain('Usuario o contraseña incorrectos.');
    expect(alerta).toContain('Te quedan 2 intento(s).');
  });

  it('avisa del bloqueo tras agotar los intentos', () => {
    entrar();
    responderError(429, {
      codigo: 'DEMASIADOS_INTENTOS',
      mensaje: '',
      detalles: { minutosRestantes: 15 },
    });

    expect(elemento.querySelector('[role="alert"]')!.textContent).toContain('15 minuto(s)');
  });

  it('una cuenta suspendida muestra el motivo y permite pedir la reactivación', () => {
    entrar();
    responderError(403, {
      codigo: 'CUENTA_SUSPENDIDA',
      mensaje: '',
      detalles: { motivo: 'INACTIVIDAD' },
    });

    const aviso = elemento.querySelector('.aviso-cuenta')!;
    expect(aviso.textContent).toContain('Más de un año sin acceder');
    expect(aviso.textContent).toContain('carloscasadoaguilera@gmail.com');
    expect(aviso.querySelector('button')!.textContent).toContain('Solicitar reactivación');
  });

  it('una cuenta eliminada indica cuándo se eliminó', () => {
    entrar();
    responderError(403, {
      codigo: 'CUENTA_ELIMINADA',
      mensaje: '',
      detalles: { fechaEliminacion: '2026-09-01' },
    });

    expect(elemento.querySelector('.aviso-cuenta')!.textContent).toContain('1 de septiembre de 2026');
  });

  it('avisa si el servidor no responde', () => {
    entrar();
    backend.expectOne(URL_LOGIN).error(new ProgressEvent('error'));
    fixture.detectChanges();

    expect(elemento.querySelector('[role="alert"]')!.textContent).toContain(
      'No se ha podido conectar con el servidor',
    );
  });
});
