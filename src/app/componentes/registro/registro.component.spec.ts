import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { UsuarioService } from '../../servicios/usuario.service';
import { sesionDePrueba } from '../../testing/datos-usuario';
import { RegistroComponent } from './registro.component';

const URL_REGISTRO = `${environment.apiBaseUrl}/usuarios/registro`;

describe('RegistroComponent', () => {
  let fixture: ComponentFixture<RegistroComponent>;
  let elemento: HTMLElement;
  let backend: HttpTestingController;

  function escribir(id: string, valor: string): void {
    const input = elemento.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  function rellenar(repetir = 'secreta123'): void {
    escribir('nombre', 'Carlos');
    escribir('apellido', 'Casado');
    escribir('correo', 'carlos@vau.com');
    escribir('fecha', '1993-05-10');
    escribir('contrasenya', 'secreta123');
    escribir('repetir', repetir);
  }

  function enviar(): void {
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.removeItem('vau.sesion');
    await TestBed.configureTestingModule({
      imports: [RegistroComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(RegistroComponent);
    elemento = fixture.nativeElement as HTMLElement;
    backend = TestBed.inject(HttpTestingController);
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  afterEach(() => backend.verify());

  it('se crea', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('no envía si las contraseñas no coinciden', () => {
    rellenar('otra12345');
    enviar();
    backend.expectNone(URL_REGISTRO);
    expect(elemento.textContent).toContain('Las contraseñas no coinciden');
  });

  it('exige una contraseña con letras y números', () => {
    escribir('contrasenya', 'solotexto');
    enviar();
    expect(elemento.querySelector('#contrasenya-ayuda.field-error')).not.toBeNull();
  });

  it('crea la cuenta y muestra un popup con el nombre de usuario', () => {
    rellenar();
    enviar();

    const peticion = backend.expectOne(URL_REGISTRO);
    expect(peticion.request.body).toEqual({
      nombre: 'Carlos',
      apellido: 'Casado',
      correo: 'carlos@vau.com',
      fechaNacimiento: '1993-05-10',
      contrasenya: 'secreta123',
    });
    peticion.flush(sesionDePrueba(), { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    expect(TestBed.inject(UsuarioService).esRegistrado()).toBeTrue();
    const popup = elemento.querySelector('[role="alertdialog"]')!;
    expect(popup.querySelector('.codigo-usuario')!.textContent).toContain('ccasado');
    expect(popup.textContent).toContain('con este nombre de usuario o con tu correo electrónico');
    // No se sale de la pantalla hasta pulsar «Entendido».
    expect(TestBed.inject(Router).navigate).not.toHaveBeenCalled();
  });

  it('al pulsar «Entendido» va a la fecha VAU', () => {
    rellenar();
    enviar();
    backend.expectOne(URL_REGISTRO).flush(sesionDePrueba(), { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    elemento.querySelector<HTMLButtonElement>('[role="alertdialog"] button')!.click();
    fixture.detectChanges();

    expect(elemento.querySelector('[role="alertdialog"]')).toBeNull();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/home']);
  });

  it('marca el correo si ya existe una cuenta con él', () => {
    rellenar();
    enviar();
    backend
      .expectOne(URL_REGISTRO)
      .flush(
        { codigo: 'CORREO_EXISTENTE', mensaje: '', detalles: {} },
        { status: 409, statusText: 'Conflict' },
      );
    fixture.detectChanges();

    expect(elemento.querySelector('#correo-error')!.textContent).toContain(
      'Ya existe una cuenta con este correo',
    );
  });
});
