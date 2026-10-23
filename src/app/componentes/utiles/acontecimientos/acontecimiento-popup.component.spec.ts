import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { authInterceptor } from '../../../guardias/auth.interceptor';
import { Acontecimiento } from '../../../interfaces/acontecimiento';
import { UsuarioService } from '../../../servicios/usuario.service';
import { sesionDePrueba } from '../../../testing/datos-usuario';
import { ModoAcontecimiento, AcontecimientoPopupComponent } from './acontecimiento-popup.component';

const API = `${environment.apiBaseUrl}/usuarios/me/acontecimientos`;

const ACONTECIMIENTO: Acontecimiento = {
  id: 7,
  fecha: '2026-10-23',
  descripcion: 'Nació mi sobrina',
  fechaCreacion: '2026-10-23T10:00:00',
  fechaModificacion: '2026-10-24T09:00:00',
  notableEvent: false,
  notableEventType: null,
};

describe('AcontecimientoPopupComponent', () => {
  let fixture: ComponentFixture<AcontecimientoPopupComponent>;
  let elemento: HTMLElement;
  let backend: HttpTestingController;

  function crear(modo: ModoAcontecimiento, acontecimiento: Acontecimiento | null = null, fechaInicial: string | null = null): void {
    fixture = TestBed.createComponent(AcontecimientoPopupComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('modo', modo);
    fixture.componentRef.setInput('acontecimiento', acontecimiento);
    fixture.componentRef.setInput('fechaInicial', fechaInicial);
    fixture.detectChanges();
  }

  function escribir(id: string, valor: string): void {
    const campo = elemento.querySelector<HTMLInputElement | HTMLTextAreaElement>(`#${id}`)!;
    campo.value = valor;
    campo.dispatchEvent(new Event('input'));
  }

  function boton(texto: string): HTMLButtonElement {
    return Array.from(elemento.querySelectorAll('button')).find((b) => b.textContent!.includes(texto))!;
  }

  function enviar(): void {
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.removeItem('vau.sesion');
    await TestBed.configureTestingModule({
      imports: [AcontecimientoPopupComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    TestBed.inject(UsuarioService).iniciarSesion(sesionDePrueba());
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('al crear rellena la fecha recibida y la deja editar', () => {
    crear('crear', null, '2026-10-23');
    expect(elemento.querySelector('h2')!.textContent).toContain('Añadir acontecimiento destacado');
    expect(elemento.querySelector<HTMLInputElement>('#acontecimiento-fecha')!.value).toBe('2026-10-23');

    let guardado: Acontecimiento | undefined;
    fixture.componentInstance.guardado.subscribe((s) => (guardado = s));

    escribir('acontecimiento-fecha', '2026-10-20');
    escribir('acontecimiento-descripcion', '  Nació mi sobrina  ');
    enviar();

    const peticion = backend.expectOne(API);
    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({ fecha: '2026-10-20', descripcion: 'Nació mi sobrina' });
    peticion.flush(ACONTECIMIENTO, { status: 201, statusText: 'Created' });

    expect(guardado).toEqual(ACONTECIMIENTO);
  });

  it('exige una descripción', () => {
    crear('crear', null, '2026-10-23');
    escribir('acontecimiento-descripcion', '   ');
    enviar();

    backend.expectNone(API);
    expect(elemento.textContent).toContain('Este campo es obligatorio');
  });

  it('avisa en la fecha si ese día ya tiene un acontecimiento', () => {
    crear('crear', null, '2026-10-23');
    escribir('acontecimiento-descripcion', 'Otro');
    enviar();
    backend.expectOne(API).flush(
      { codigo: 'ACONTECIMIENTO_DUPLICADO', mensaje: '', detalles: {} },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(elemento.querySelector('#acontecimiento-fecha-error')!.textContent).toContain(
      'Ya tienes un acontecimiento destacado ese día.',
    );
  });

  it('modificar parte de los datos actuales y hace PUT', () => {
    crear('modificar', ACONTECIMIENTO);
    expect(elemento.querySelector<HTMLTextAreaElement>('#acontecimiento-descripcion')!.value).toBe(
      'Nació mi sobrina',
    );

    escribir('acontecimiento-descripcion', 'Nació Lucía');
    enviar();

    const peticion = backend.expectOne(`${API}/7`);
    expect(peticion.request.method).toBe('PUT');
    expect(peticion.request.body).toEqual({ fecha: '2026-10-23', descripcion: 'Nació Lucía' });
    peticion.flush({ ...ACONTECIMIENTO, descripcion: 'Nació Lucía' });
  });

  it('ver muestra fecha, descripción y última modificación, y permite pasar a modificar', () => {
    crear('ver', ACONTECIMIENTO);
    expect(elemento.textContent).toContain('23 de octubre de 2026');
    expect(elemento.textContent).toContain('Nació mi sobrina');
    expect(elemento.textContent).toContain('Última modificación: 24 de octubre de 2026');

    boton('Modificar').click();
    fixture.detectChanges();
    expect(elemento.querySelector('#acontecimiento-descripcion')).not.toBeNull();
  });

  it('ver muestra el evento reseñable de ese día si lo hay', () => {
    crear('ver', { ...ACONTECIMIENTO, notableEvent: true, notableEventType: 'Luna llena' });
    expect(elemento.querySelector('.evento-del-dia')!.textContent).toContain('Evento reseñable de ese día');
    expect(elemento.querySelector('.evento-del-dia')!.textContent).toContain('Luna llena');
  });

  it('sin evento reseñable no muestra ese bloque', () => {
    crear('ver', ACONTECIMIENTO);
    expect(elemento.querySelector('.evento-del-dia')).toBeNull();
  });

  it('eliminar pide confirmación y hace DELETE', () => {
    crear('eliminar', ACONTECIMIENTO);
    expect(elemento.textContent).toContain('¿Seguro que quieres eliminar el acontecimiento del 23 de octubre de 2026?');

    let eliminado: Acontecimiento | undefined;
    fixture.componentInstance.eliminado.subscribe((s) => (eliminado = s));

    boton('Sí, eliminar').click();
    const peticion = backend.expectOne(`${API}/7`);
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null, { status: 204, statusText: 'No Content' });

    expect(eliminado).toEqual(ACONTECIMIENTO);
  });

  it('se cierra con Escape', () => {
    crear('ver', ACONTECIMIENTO);
    let cerrado = false;
    fixture.componentInstance.cerrar.subscribe(() => (cerrado = true));

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(cerrado).toBeTrue();
  });
});
