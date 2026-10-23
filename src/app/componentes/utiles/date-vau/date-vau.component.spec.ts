import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { VAUResponse } from '../../../interfaces/vau-response';
import { DatesService } from '../../../servicios/dates.service';
import { UsuarioService } from '../../../servicios/usuario.service';
import { sesionDePrueba } from '../../../testing/datos-usuario';
import { DateVAUComponent } from './date-vau.component';

const FECHA = '2026-10-23';
const URL_ACONTECIMIENTO = `${environment.apiBaseUrl}/usuarios/me/acontecimientos/fecha/${FECHA}`;

/** Lo justo para pintar la vista principal (sin «Más detalles»). */
const RESPUESTA = {
  fechaEncontrada: true,
  fechaO: FECHA,
  season: { name: 'Otoño', surname: 'iniciante' },
  month: { name: 'Pridor', surname: '', newMoon: false },
  week: 'Segana',
  day: 'Júpeno',
  year: { solsticiosDeInviernoSinceLastMetonIN: 11 },
  festividades: { festividadActual: null, festividadAnterior: 'A', festividadProxima: 'B' },
  notableEvent: { today: null, previous: 'Luna cuarto creciente', next: 'Luna llena' },
} as unknown as VAUResponse;

describe('DateVAUComponent', () => {
  let fixture: ComponentFixture<DateVAUComponent>;
  let elemento: HTMLElement;

  function crear(): void {
    fixture = TestBed.createComponent(DateVAUComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('fecha', FECHA);
    fixture.detectChanges();
    // `toObservable` emite en el primer ciclo; el segundo pinta la respuesta.
    fixture.detectChanges();
  }

  beforeEach(async () => {
    sessionStorage.removeItem('vau.sesion');
    await TestBed.configureTestingModule({
      imports: [DateVAUComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('muestra el esqueleto de carga mientras espera a la API', () => {
    crear();
    expect(elemento.querySelector('.esqueleto')).not.toBeNull();
  });

  describe('con datos de la API', () => {
    beforeEach(() => {
      spyOn(TestBed.inject(DatesService), 'getVAU').and.returnValue(of(RESPUESTA));
    });

    it('ya no ofrece copiar ni imprimir', () => {
      crear();
      expect(elemento.textContent).toContain('Más detalles');
      expect(elemento.textContent).not.toContain('Copiar resumen');
      expect(elemento.textContent).not.toContain('Imprimir');
    });

    it('un invitado no ve nada de acontecimientos destacados', () => {
      TestBed.inject(UsuarioService).setEsInvitado(true);
      crear();
      TestBed.inject(HttpTestingController).expectNone(URL_ACONTECIMIENTO);
      expect(elemento.textContent).not.toContain('Añadir acontecimiento destacado');
    });

    describe('como usuario registrado', () => {
      let backend: HttpTestingController;

      beforeEach(() => {
        TestBed.inject(UsuarioService).iniciarSesion(sesionDePrueba());
        backend = TestBed.inject(HttpTestingController);
      });

      it('si el día no tiene acontecimiento ofrece añadirlo con esa fecha', () => {
        crear();
        backend.expectOne(URL_ACONTECIMIENTO).flush(null, { status: 204, statusText: 'No Content' });
        fixture.detectChanges();

        const boton = Array.from(elemento.querySelectorAll('button')).find((b) =>
          b.textContent!.includes('Añadir acontecimiento destacado'),
        )!;
        // Va entre «Próximo evento reseñable» y «Más detalles».
        const eventos = elemento.querySelector('.rejilla-eventos')!;
        const detalles = elemento.querySelector('.acciones')!;
        expect(eventos.compareDocumentPosition(boton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(boton.compareDocumentPosition(detalles) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        boton.click();
        fixture.detectChanges();

        expect(elemento.querySelector<HTMLInputElement>('#acontecimiento-fecha')!.value).toBe(FECHA);
      });

      it('si el día tiene acontecimiento lo muestra debajo de la fecha y oculta «Añadir»', () => {
        crear();
        backend.expectOne(URL_ACONTECIMIENTO).flush({
          id: 1,
          fecha: FECHA,
          descripcion: 'Nació mi sobrina',
          fechaCreacion: '2026-10-23T10:00:00',
          fechaModificacion: '2026-10-23T10:00:00',
        });
        fixture.detectChanges();

        const bloque = elemento.querySelector('.acontecimiento')!;
        expect(bloque.textContent).toContain('Tu acontecimiento destacado');
        expect(bloque.textContent).toContain('Nació mi sobrina');
        // Justo después de la cabecera con la fecha y antes de los datos VAU.
        const fecha = elemento.querySelector('.navegador')!;
        const datos = elemento.querySelector('.rejilla-eventos')!;
        expect(fecha.compareDocumentPosition(bloque) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(bloque.compareDocumentPosition(datos) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(elemento.textContent).not.toContain('Añadir acontecimiento destacado');
      });
    });
  });
});
