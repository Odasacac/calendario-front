import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { authInterceptor } from '../../../guardias/auth.interceptor';
import { UsuarioService } from '../../../servicios/usuario.service';
import { lunacionDePrueba } from '../../../testing/datos-calendario';
import { sesionDePrueba } from '../../../testing/datos-usuario';
import { hoyIso } from '../../../utiles/fechas';
import { CalendarioVAUComponent } from './calendario-vau.component';

const API = `${environment.apiBaseUrl}/calendario`;
const ACONTECIMIENTOS = `${environment.apiBaseUrl}/usuarios/me/acontecimientos`;

describe('CalendarioVAUComponent', () => {
  let fixture: ComponentFixture<CalendarioVAUComponent>;
  let elemento: HTMLElement;
  let backend: HttpTestingController;

  function crear(fecha = '2026-10-23'): void {
    fixture = TestBed.createComponent(CalendarioVAUComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('fecha', fecha);
    fixture.detectChanges();
    fixture.detectChanges();
  }

  /** Responde a la lunación pedida y a las precargas de sus vecinas. */
  function responderLunacion(inicio = '2026-10-10', cambios = {}): void {
    backend
      .expectOne((r) => r.url === `${API}/lunacion` && !['2026-10-09', '2026-11-09'].includes(r.params.get('fecha')!))
      .flush(lunacionDePrueba(inicio, cambios));
    fixture.detectChanges();
    backend.match((r) => r.url === `${API}/lunacion`).forEach((r) => r.flush(lunacionDePrueba(r.request.params.get('fecha')!)));
  }

  function celda(fecha: string): HTMLButtonElement {
    return Array.from(elemento.querySelectorAll<HTMLButtonElement>('button.dia')).find((b) =>
      b.getAttribute('aria-label')!.includes(fecha),
    )!;
  }

  function boton(texto: string): HTMLButtonElement {
    return Array.from(elemento.querySelectorAll('button')).find(
      (b) => b.textContent!.includes(texto) || b.getAttribute('aria-label') === texto,
    )!;
  }

  beforeEach(async () => {
    sessionStorage.removeItem('vau.sesion');
    await TestBed.configureTestingModule({
      imports: [CalendarioVAUComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
    backend = TestBed.inject(HttpTestingController);
  });

  it('pinta la cabecera, la fila Terra y cada día en su semana y columna', () => {
    crear();
    responderLunacion();

    expect(elemento.querySelector('.titulo')!.textContent).toContain('Pridor');
    expect(elemento.textContent).toContain('Año VAU 11');
    expect(elemento.textContent).toContain('Métono invernal nuevo 43');
    expect(elemento.querySelector('.fila-terra')!.textContent).toContain('10 de octubre de 2026');

    // Segana (2.ª fila de semanas) · Júpeno (6.ª columna) = 23 de octubre
    const filas = elemento.querySelectorAll('tbody tr:not(.fila-terra)');
    const segana = filas[1];
    expect(segana.querySelector('th')!.textContent).toContain('Segana');
    expect(segana.querySelectorAll('td')[5].textContent).toContain('Júpeno');
    expect(segana.querySelectorAll('td')[5].textContent).toContain('23 oct');

    // Limana: solo Liminol en la primera columna
    const limana = filas[4];
    expect(limana.querySelectorAll('td')[0].textContent).toContain('Liminol');
    expect(limana.querySelectorAll('td button').length).toBe(1);
  });

  it('festividades en amarillo y eclipses en morado, como el PDF', () => {
    crear();
    const lunacion = lunacionDePrueba();
    lunacion.dias[27].festividad = 'Midsison otoñal';
    lunacion.dias[27].evento = 'Midsison otoñal';
    lunacion.dias[5].evento = 'Eclipse de sol anular';
    lunacion.dias[5].eclipse = true;
    lunacion.dias[5].eventoResenyable = true;
    backend.expectOne((r) => r.params.get('fecha') === '2026-10-23').flush(lunacion);
    fixture.detectChanges();
    backend.match((r) => r.url === `${API}/lunacion`).forEach((r) => r.flush(lunacionDePrueba(r.request.params.get('fecha')!)));

    const midsison = celda(lunacion.dias[27].fecha === '2026-11-06' ? '6 de noviembre' : '');
    expect(midsison.classList).toContain('festivo');
    // El evento igual a la festividad no se repite
    expect(midsison.querySelectorAll('.linea').length).toBe(1);
    expect(celda('15 de octubre').classList).toContain('eclipse');
  });

  it('al pulsar un día emite su fecha para abrir el detalle', () => {
    crear();
    responderLunacion();
    let abierto = '';
    fixture.componentInstance.abrirDia.subscribe((f) => (abierto = f));

    celda('23 de octubre').click();
    expect(abierto).toBe('2026-10-23');
  });

  it('las flechas piden la lunación anterior y la siguiente', () => {
    crear();
    responderLunacion();
    const pedidas: string[] = [];
    fixture.componentInstance.fechaChange.subscribe((f) => pedidas.push(f));

    boton('Mes siguiente').click();
    boton('Mes anterior').click();
    expect(pedidas).toEqual(['2026-11-09', '2026-10-09']);
  });

  it('«Hoy» está desactivado si la lunación ya contiene hoy', () => {
    const hoy = hoyIso();
    crear(hoy);
    // Una lunación que empieza 5 días antes de hoy contiene hoy.
    const inicio = new Date(`${hoy}T00:00:00Z`);
    inicio.setUTCDate(inicio.getUTCDate() - 5);
    backend.expectOne((r) => r.params.get('fecha') === hoy).flush(lunacionDePrueba(inicio.toISOString().slice(0, 10)));
    fixture.detectChanges();
    backend.match((r) => r.url === `${API}/lunacion`).forEach((r) => r.flush(lunacionDePrueba(r.request.params.get('fecha')!)));

    expect(boton('Hoy').disabled).toBeTrue();
    expect(elemento.querySelector('button.dia.hoy')).not.toBeNull();
  });

  it('un usuario registrado ve estrella en los días con acontecimiento', () => {
    TestBed.inject(UsuarioService).iniciarSesion(sesionDePrueba());
    crear();
    backend.expectOne(ACONTECIMIENTOS).flush([
      {
        id: 1,
        fecha: '2026-10-26',
        descripcion: 'x',
        fechaCreacion: '',
        fechaModificacion: '',
        notableEvent: false,
        notableEventType: null,
      },
    ]);
    responderLunacion();

    expect(celda('26 de octubre').querySelector('.estrella')).not.toBeNull();
    expect(celda('25 de octubre').querySelector('.estrella')).toBeNull();
    expect(elemento.querySelector('.senyalados')!.textContent).toContain('Acontecimiento destacado');
  });

  it('un invitado no pide acontecimientos', () => {
    TestBed.inject(UsuarioService).setEsInvitado(true);
    crear();
    responderLunacion();
    backend.expectNone(ACONTECIMIENTOS);
  });

  it('el selector se abre en el métono, año y mes actuales y salta al mes elegido', () => {
    crear();
    responderLunacion();
    let destino = '';
    fixture.componentInstance.fechaChange.subscribe((f) => (destino = f));

    boton('Elegir mes').click();
    fixture.detectChanges();
    backend.expectOne(`${API}/metonos`).flush([
      { id: 1643, numero: 42, apellido: '(Invertido)', inicio: '1995-12-23', fin: '2014-12-21' },
      { id: 1671, numero: 43, apellido: null, inicio: '2014-12-22', fin: '2033-12-21' },
    ]);
    backend.expectOne(`${API}/metonos/1671/anyos`).flush([
      { numero: 10, inicio: '2024-12-22', fin: '2025-12-21' },
      { numero: 11, inicio: '2025-12-22', fin: '2026-12-21' },
    ]);
    backend.expectOne((r) => r.url === `${API}/meses` && r.params.get('inicio') === '2025-12-22').flush([
      { nombre: 'Sedor', apellido: null, fecha: '2026-11-09' },
      { nombre: 'Pridor', apellido: null, fecha: '2026-10-10' },
    ]);
    fixture.detectChanges();

    const selects = elemento.querySelectorAll<HTMLSelectElement>('#selector-lunacion select');
    expect(selects[0].selectedOptions[0].textContent).toContain('Métono 43');
    expect(selects[1].selectedOptions[0].textContent).toContain('Año 11');
    expect(selects[2].selectedOptions[0].textContent).toContain('Pridor');

    selects[2].value = '2026-11-09';
    selects[2].dispatchEvent(new Event('change'));
    boton('Ir al mes').click();
    expect(destino).toBe('2026-11-09');
  });

  it('si falla la carga ofrece reintentar', () => {
    crear();
    backend.expectOne((r) => r.url === `${API}/lunacion`).flush(null, { status: 500, statusText: 'Error' });
    fixture.detectChanges();

    expect(elemento.textContent).toContain('No se ha podido cargar el calendario.');
    boton('Reintentar').click();
    fixture.detectChanges();
    responderLunacion();
    expect(elemento.querySelector('.titulo')!.textContent).toContain('Pridor');
  });
});
