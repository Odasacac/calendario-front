import { HttpRequest, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, TestRequest, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { authInterceptor } from '../../../guardias/auth.interceptor';
import { Acontecimiento, Pagina } from '../../../interfaces/acontecimiento';
import { UsuarioService } from '../../../servicios/usuario.service';
import { sesionDePrueba } from '../../../testing/datos-usuario';
import { AcontecimientosComponent } from './acontecimientos.component';

const API = `${environment.apiBaseUrl}/usuarios/me/acontecimientos`;
const CLAVE_TAMANYO = 'vau.acontecimientos.tamanyo';

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

function pagina(
  contenido: Acontecimiento[],
  numero = 0,
  tamanyo = 10,
  totalElementos = contenido.length,
): Pagina<Acontecimiento> {
  return {
    contenido,
    pagina: numero,
    tamanyo,
    totalElementos,
    totalPaginas: Math.ceil(totalElementos / tamanyo),
  };
}

describe('AcontecimientosComponent', () => {
  let fixture: ComponentFixture<AcontecimientosComponent>;
  let elemento: HTMLElement;
  let backend: HttpTestingController;

  /** Petición del listado; comprueba la página y el tamaño pedidos. */
  function peticion(numero: number, tamanyo: number): TestRequest {
    return backend.expectOne(
      (r: HttpRequest<unknown>) =>
        r.method === 'GET' &&
        r.url === API &&
        r.params.get('pagina') === String(numero) &&
        r.params.get('tamanyo') === String(tamanyo),
    );
  }

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
    localStorage.removeItem(CLAVE_TAMANYO);
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

  afterEach(() => {
    backend.verify();
    localStorage.removeItem(CLAVE_TAMANYO);
  });

  it('lista la primera página con columnas Fecha y Acciones', () => {
    peticion(0, 10).flush(pagina([acontecimiento(2, '2026-10-23'), acontecimiento(1, '2025-01-05')]));
    fixture.detectChanges();

    const cabeceras = Array.from(elemento.querySelectorAll('th')).map((th) => th.textContent!.trim());
    expect(cabeceras).toEqual(['Fecha', 'Acciones']);
    expect(filas()).toEqual(['23 de octubre de 2026', '5 de enero de 2025']);
    expect(elemento.querySelectorAll('tbody tr:first-child button').length).toBe(3);
    expect(elemento.querySelector('app-paginador')!.textContent).toContain('1–2 de 2');
  });

  it('sin acontecimientos muestra un aviso y no el paginador', () => {
    peticion(0, 10).flush(pagina([]));
    fixture.detectChanges();
    expect(elemento.textContent).toContain('Todavía no has apuntado ningún acontecimiento destacado.');
    expect(elemento.querySelector('app-paginador')).toBeNull();
  });

  it('el paginador pide la página elegida', () => {
    peticion(0, 10).flush(pagina([acontecimiento(1, '2026-10-23')], 0, 10, 25));
    fixture.detectChanges();

    elemento.querySelector<HTMLButtonElement>('[aria-label="Página siguiente"]')!.click();
    peticion(1, 10).flush(pagina([acontecimiento(11, '2026-01-01')], 1, 10, 25));
    fixture.detectChanges();

    expect(filas()).toEqual(['1 de enero de 2026']);
    expect(elemento.querySelector('app-paginador')!.textContent).toContain('11–20 de 25');
  });

  it('al cambiar el tamaño mantiene a la vista el primer elemento y lo recuerda', () => {
    peticion(0, 10).flush(pagina([acontecimiento(1, '2026-10-23')], 0, 10, 60));
    fixture.detectChanges();
    elemento.querySelector<HTMLButtonElement>('[aria-label="Página siguiente"]')!.click();
    peticion(1, 10).flush(pagina([acontecimiento(11, '2026-01-01')], 1, 10, 60));
    fixture.detectChanges();
    elemento.querySelector<HTMLButtonElement>('[aria-label="Página siguiente"]')!.click();
    peticion(2, 10).flush(pagina([acontecimiento(21, '2026-01-01')], 2, 10, 60));
    fixture.detectChanges();

    const select = elemento.querySelector<HTMLSelectElement>('.select-tamanyo')!;
    select.value = '5';
    select.dispatchEvent(new Event('change'));
    // Se veía desde el elemento 21 (índice 20): con 5 por página es la página de índice 4.
    peticion(4, 5).flush(pagina([acontecimiento(21, '2026-01-01')], 4, 5, 60));

    expect(localStorage.getItem(CLAVE_TAMANYO)).toBe('5');
  });

  it('usa el tamaño guardado si es válido', () => {
    peticion(0, 10).flush(pagina([]));
    localStorage.setItem(CLAVE_TAMANYO, '20');
    TestBed.createComponent(AcontecimientosComponent).detectChanges();
    peticion(0, 20).flush(pagina([]));
  });

  it('si falla la carga muestra un error y permite reintentar', () => {
    peticion(0, 10).flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();
    expect(elemento.querySelector('[role="alert"]')).not.toBeNull();

    boton('Reintentar').click();
    peticion(0, 10).flush(pagina([acontecimiento(1, '2026-10-23')]));
    fixture.detectChanges();
    expect(filas()).toEqual(['23 de octubre de 2026']);
  });

  it('«Añadir acontecimiento destacado» está en la cabecera y abre el formulario', () => {
    peticion(0, 10).flush(pagina([]));
    fixture.detectChanges();

    boton('Añadir acontecimiento destacado').click();
    fixture.detectChanges();
    expect(elemento.querySelector('#acontecimiento-fecha')).not.toBeNull();
  });

  it('cada acción abre su popup', () => {
    peticion(0, 10).flush(pagina([acontecimiento(1, '2026-10-23')]));
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

  it('al eliminar recarga la página actual', () => {
    peticion(0, 10).flush(pagina([acontecimiento(2, '2026-10-23'), acontecimiento(1, '2025-01-05')]));
    fixture.detectChanges();

    (elemento.querySelectorAll('tbody tr')[0].querySelectorAll('button')[2] as HTMLButtonElement).click();
    fixture.detectChanges();
    boton('Sí, eliminar').click();
    backend.expectOne(`${API}/2`).flush(null, { status: 204, statusText: 'No Content' });
    peticion(0, 10).flush(pagina([acontecimiento(1, '2025-01-05')]));
    fixture.detectChanges();

    expect(elemento.querySelector('[role="dialog"]')).toBeNull();
    expect(filas()).toEqual(['5 de enero de 2025']);
  });

  it('al guardar recarga la página en la que se estaba', () => {
    peticion(0, 10).flush(pagina([acontecimiento(1, '2026-10-23')], 0, 10, 25));
    fixture.detectChanges();
    elemento.querySelector<HTMLButtonElement>('[aria-label="Página 2"]')!.click();
    peticion(1, 10).flush(pagina([acontecimiento(11, '2026-01-01')], 1, 10, 25));

    fixture.componentInstance['alCambiar']();
    peticion(1, 10).flush(pagina([acontecimiento(11, '2026-01-01')], 1, 10, 26));
    fixture.detectChanges();
    expect(elemento.querySelector('app-paginador')!.textContent).toContain('11–20 de 26');
  });

  it('la flecha emite `back`', () => {
    peticion(0, 10).flush(pagina([]));
    let atras = false;
    fixture.componentInstance.back.subscribe(() => (atras = true));

    (elemento.querySelector('.cabecera-lista button') as HTMLButtonElement).click();
    expect(atras).toBeTrue();
  });
});
