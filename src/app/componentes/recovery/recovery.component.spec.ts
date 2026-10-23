import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { NotificacionesService } from '../../servicios/notificaciones.service';
import { RecoveryComponent } from './recovery.component';

const URL_VERIFICAR = `${environment.apiBaseUrl}/usuarios/recuperacion/verificar`;
const URL_RESTABLECER = `${environment.apiBaseUrl}/usuarios/recuperacion/restablecer`;

describe('RecoveryComponent', () => {
  let fixture: ComponentFixture<RecoveryComponent>;
  let elemento: HTMLElement;
  let backend: HttpTestingController;

  function escribir(id: string, valor: string): void {
    const input = elemento.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  function enviar(): void {
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  function pasarAlPaso2(): void {
    escribir('codigoUsuario', 'CCasado');
    escribir('correo', 'carlos@vau.com');
    enviar();
    backend.expectOne(URL_VERIFICAR).flush({ token: 'tok-rec' });
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecoveryComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RecoveryComponent);
    elemento = fixture.nativeElement as HTMLElement;
    backend = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  afterEach(() => backend.verify());

  it('se crea', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('pide código de usuario y correo', () => {
    expect(elemento.querySelector('#codigoUsuario')).not.toBeNull();
    expect(elemento.querySelector('#correo')).not.toBeNull();
  });

  it('informa si el código y el correo no son de la misma cuenta', () => {
    escribir('codigoUsuario', 'ccasado');
    escribir('correo', 'otro@vau.com');
    enviar();
    backend.expectOne(URL_VERIFICAR).flush(
      { codigo: 'DATOS_RECUPERACION_INVALIDOS', mensaje: '', detalles: { intentosRestantes: 1 } },
      { status: 401, statusText: 'Unauthorized' },
    );
    fixture.detectChanges();

    expect(elemento.querySelector('[role="alert"]')!.textContent).toContain(
      'No hay ninguna cuenta con ese código de usuario y ese correo.',
    );
    expect(elemento.querySelector('#nueva')).toBeNull();
  });

  it('tras verificar pide la nueva contraseña dos veces y la guarda', () => {
    pasarAlPaso2();
    expect(elemento.textContent).toContain('«ccasado»');

    escribir('nueva', 'nueva1234');
    escribir('repetir', 'nueva1234');
    enviar();

    const peticion = backend.expectOne(URL_RESTABLECER);
    expect(peticion.request.body).toEqual({
      token: 'tok-rec',
      nueva: 'nueva1234',
      confirmacion: 'nueva1234',
    });
    peticion.flush(null, { status: 204, statusText: 'No Content' });

    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login']);
  });

  it('no guarda si las contraseñas no coinciden', () => {
    pasarAlPaso2();
    escribir('nueva', 'nueva1234');
    escribir('repetir', 'nueva12345');
    enviar();

    backend.expectNone(URL_RESTABLECER);
    expect(elemento.textContent).toContain('Las contraseñas no coinciden');
  });

  it('si el token caduca vuelve al primer paso', () => {
    pasarAlPaso2();
    escribir('nueva', 'nueva1234');
    escribir('repetir', 'nueva1234');
    enviar();
    backend.expectOne(URL_RESTABLECER).flush(
      { codigo: 'TOKEN_RECUPERACION_INVALIDO', mensaje: '', detalles: {} },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(elemento.querySelector('#codigoUsuario')).not.toBeNull();
    expect(elemento.textContent).toContain('ha caducado');
  });

  it('el botón de ayuda solo confirma que la petición se ha enviado', () => {
    const exito = spyOn(TestBed.inject(NotificacionesService), 'exito');
    const boton = Array.from(elemento.querySelectorAll('button')).find((b) =>
      b.textContent!.includes('Enviar petición por correo'),
    )!;
    boton.click();

    expect(exito).toHaveBeenCalledWith('Petición de cambio de contraseña enviada');
    backend.expectNone(() => true);
  });
});
