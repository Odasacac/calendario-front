import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { authInterceptor } from '../../../guardias/auth.interceptor';
import { UsuarioService } from '../../../servicios/usuario.service';
import { sesionDePrueba, usuarioDePrueba } from '../../../testing/datos-usuario';
import { CuentaComponent } from './cuenta.component';

const API = `${environment.apiBaseUrl}/usuarios`;

describe('CuentaComponent', () => {
  let fixture: ComponentFixture<CuentaComponent>;
  let elemento: HTMLElement;
  let backend: HttpTestingController;
  let usuarios: UsuarioService;

  function boton(texto: string): HTMLButtonElement {
    return Array.from(elemento.querySelectorAll<HTMLButtonElement>('button')).find((b) =>
      b.textContent!.includes(texto),
    )!;
  }

  function escribir(id: string, valor: string): void {
    const input = elemento.querySelector<HTMLInputElement>(`#${id}`)!;
    input.value = valor;
    input.dispatchEvent(new Event('input'));
  }

  beforeEach(async () => {
    sessionStorage.removeItem('vau.sesion');
    await TestBed.configureTestingModule({
      imports: [CuentaComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    usuarios = TestBed.inject(UsuarioService);
    usuarios.iniciarSesion(sesionDePrueba());
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(CuentaComponent);
    elemento = fixture.nativeElement as HTMLElement;
    backend = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => backend.verify());

  it('refresca el perfil al abrirse y muestra nombre y código de usuario', () => {
    const peticion = backend.expectOne(`${API}/me`);
    expect(peticion.request.headers.get('Authorization')).toBe('Bearer token-de-prueba');
    peticion.flush(usuarioDePrueba({ nombre: 'Carlos' }));
    fixture.detectChanges();

    expect(elemento.querySelector('h2')!.textContent).toContain('Hola, Carlos');
    expect(elemento.querySelector('.codigo')!.textContent).toContain('ccasado');
  });

  it('emite `acontecimientos` al pulsar «Ver acontecimientos destacados»', () => {
    backend.expectOne(`${API}/me`).flush(usuarioDePrueba());
    let emitido = false;
    fixture.componentInstance.acontecimientos.subscribe(() => (emitido = true));

    boton('Ver acontecimientos destacados').click();
    expect(emitido).toBeTrue();
  });

  it('avisa si el código de usuario cambia al editar el perfil', () => {
    backend.expectOne(`${API}/me`).flush(usuarioDePrueba());
    fixture.detectChanges();

    boton('Editar datos').click();
    fixture.detectChanges();
    escribir('cuenta-nombre', 'Lucía');
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));

    const peticion = backend.expectOne(`${API}/me`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body.nombre).toBe('Lucía');
    peticion.flush(usuarioDePrueba({ nombre: 'Lucía', codigoUsuario: 'lcasado' }));

    expect(usuarios.usuario()?.codigoUsuario).toBe('lcasado');
  });

  it('suspender pide confirmación, cierra la sesión y vuelve al login', () => {
    backend.expectOne(`${API}/me`).flush(usuarioDePrueba());
    fixture.detectChanges();

    boton('Suspender cuenta').click();
    fixture.detectChanges();
    backend.expectNone(`${API}/me/suspender`);

    boton('Sí, suspender').click();
    backend.expectOne(`${API}/me/suspender`).flush(null, { status: 204, statusText: 'No Content' });

    expect(usuarios.esRegistrado()).toBeFalse();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/login']);
  });

  it('eliminar exige la contraseña', () => {
    backend.expectOne(`${API}/me`).flush(usuarioDePrueba());
    fixture.detectChanges();

    boton('Eliminar cuenta').click();
    fixture.detectChanges();
    boton('Eliminar definitivamente').click();
    fixture.detectChanges();
    backend.expectNone(`${API}/me/eliminar`);

    escribir('cuenta-eliminar', 'secreta123');
    boton('Eliminar definitivamente').click();
    const peticion = backend.expectOne(`${API}/me/eliminar`);
    expect(peticion.request.body).toEqual({ contrasenya: 'secreta123' });
    peticion.flush(null, { status: 204, statusText: 'No Content' });

    expect(usuarios.esRegistrado()).toBeFalse();
  });

  it('muestra los intentos restantes si la contraseña de confirmación es incorrecta', () => {
    backend.expectOne(`${API}/me`).flush(usuarioDePrueba());
    fixture.detectChanges();

    boton('Eliminar cuenta').click();
    fixture.detectChanges();
    escribir('cuenta-eliminar', 'mala1234');
    boton('Eliminar definitivamente').click();
    backend.expectOne(`${API}/me/eliminar`).flush(
      { codigo: 'CONTRASENYA_ACTUAL_INCORRECTA', mensaje: '', detalles: { intentosRestantes: 2 } },
      { status: 400, statusText: 'Bad Request' },
    );
    fixture.detectChanges();

    expect(elemento.querySelector('[role="alert"]')!.textContent).toContain('Te quedan 2 intento(s).');
    expect(usuarios.esRegistrado()).toBeTrue();
  });
});
