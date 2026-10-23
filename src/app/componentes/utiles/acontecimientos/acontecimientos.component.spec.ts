import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { authInterceptor } from '../../../guardias/auth.interceptor';
import { Acontecimiento } from '../../../interfaces/acontecimiento';
import { UsuarioService } from '../../../servicios/usuario.service';
import { sesionDePrueba } from '../../../testing/datos-usuario';
import { AcontecimientosComponent } from './acontecimientos.component';

const API = `${environment.apiBaseUrl}/usuarios/me/acontecimientos`;

function acontecimiento(id: number, fecha: string): Acontecimiento {
  return {
    id,
    fecha,
    descripcion: `Acontecimiento ${id}`,
    fechaCreacion: `${fecha}T10:00:00`,
    fechaModificacion: `${fecha}T10:00:00`,
    notableEvent: false,
    notableEventType: null,
  };
}

describe('AcontecimientosComponent', () => {
  let fixture: ComponentFixture<AcontecimientosComponent>;
  let elemento: HTMLElement;
  let backend: HttpTestingController;

  function filas(): string[] {
    return Array.from(elemento.querySelectorAll('tbody tr td:first-child')).map((td) =>
      td.textContent!.trim(),
    );
  }

  function boton(texto: string): HTMLButtonElement {
    return Array.from(elemento.querySelectorAll('button')).find((b) => b.textContent!.includes(texto))!;
  }

  beforeEach(async () => {
    sessionStorage.removeItem('vau.sesion');
    await TestBed.configureTestingModule({
      imports: [AcontecimientosComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    TestBed.inject(UsuarioService).iniciarSesion(sesionDePrueba());
    backend = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(AcontecimientosComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  afterEach(() => backend.verify());

  it('lista los acontecimientos con columnas Fecha y Acciones', () => {
    backend.expectOne(API).flush([acontecimiento(2, '2026-10-23'), acontecimiento(1, '2025-01-05')]);
    fixture.detectChanges();

    const cabeceras = Array.from(elemento.querySelectorAll('th')).map((th) => th.textContent!.trim());
    expect(cabeceras).toEqual(['Fecha', 'Acciones']);
    expect(filas()).toEqual(['23 de octubre de 2026', '5 de enero de 2025']);
    expect(elemento.querySelectorAll('tbody tr:first-child button').length).toBe(3);
  });

  it('sin acontecimientos muestra un aviso', () => {
    backend.expectOne(API).flush([]);
    fixture.detectChanges();
    expect(elemento.textContent).toContain('Todavía no has apuntado ningún acontecimiento destacado.');
  });

  it('«Añadir acontecimiento destacado» está en la cabecera y abre el formulario', () => {
    backend.expectOne(API).flush([]);
    fixture.detectChanges();

    boton('Añadir acontecimiento destacado').click();
    fixture.detectChanges();
    expect(elemento.querySelector('#acontecimiento-fecha')).not.toBeNull();
  });

  it('cada acción abre su popup', () => {
    backend.expectOne(API).flush([acontecimiento(1, '2026-10-23')]);
    fixture.detectChanges();

    boton('Ver').click();
    fixture.detectChanges();
    expect(elemento.querySelector('[role="dialog"] h2')!.textContent).toContain('Acontecimiento destacado');

    fixture.componentInstance['cerrarPopup']();
    fixture.detectChanges();
    boton('Eliminar').click();
    fixture.detectChanges();
    expect(elemento.querySelector('[role="dialog"] h2')!.textContent).toContain('Eliminar acontecimiento destacado');
  });

  it('al eliminar desaparece de la lista', () => {
    backend.expectOne(API).flush([acontecimiento(2, '2026-10-23'), acontecimiento(1, '2025-01-05')]);
    fixture.detectChanges();

    (elemento.querySelectorAll('tbody tr')[0].querySelectorAll('button')[2] as HTMLButtonElement).click();
    fixture.detectChanges();
    boton('Sí, eliminar').click();
    backend.expectOne(`${API}/2`).flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(filas()).toEqual(['5 de enero de 2025']);
  });

  it('al guardar uno nuevo lo coloca en su sitio por fecha', () => {
    backend.expectOne(API).flush([acontecimiento(2, '2026-10-23'), acontecimiento(1, '2025-01-05')]);
    fixture.detectChanges();

    fixture.componentInstance['alGuardar'](acontecimiento(3, '2026-01-01'));
    fixture.detectChanges();

    expect(filas()).toEqual(['23 de octubre de 2026', '1 de enero de 2026', '5 de enero de 2025']);
  });

  it('la flecha emite `back`', () => {
    backend.expectOne(API).flush([]);
    let atras = false;
    fixture.componentInstance.back.subscribe(() => (atras = true));

    (elemento.querySelector('.cabecera-lista button') as HTMLButtonElement).click();
    expect(atras).toBeTrue();
  });
});
