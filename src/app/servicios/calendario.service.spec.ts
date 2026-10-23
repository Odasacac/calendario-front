import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { lunacionDePrueba } from '../testing/datos-calendario';
import { CalendarioService } from './calendario.service';

const URL = `${environment.apiBaseUrl}/calendario/lunacion`;

describe('CalendarioService', () => {
  let servicio: CalendarioService;
  let backend: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    servicio = TestBed.inject(CalendarioService);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('una vez cargada, cualquier día de la lunación sale de la memoria', () => {
    servicio.lunacion('2026-10-23').subscribe();
    backend.expectOne((r) => r.url === URL && r.params.get('fecha') === '2026-10-23').flush(lunacionDePrueba());

    let desdeCache = '';
    servicio.lunacion('2026-11-01').subscribe((l) => (desdeCache = l.inicio));
    backend.expectNone((r) => r.url === URL);
    expect(desdeCache).toBe('2026-10-10');
  });

  it('precarga las lunaciones vecinas una sola vez', () => {
    const lunacion = lunacionDePrueba();
    servicio.precargarVecinas(lunacion);
    servicio.precargarVecinas(lunacion);

    const peticiones = backend.match((r) => r.url === URL);
    expect(peticiones.map((r) => r.request.params.get('fecha')).sort()).toEqual(['2026-10-09', '2026-11-09']);
    peticiones.forEach((r) => r.flush(lunacionDePrueba(r.request.params.get('fecha')!)));
  });

  it('un error no se queda guardado: el siguiente intento vuelve a pedirla', () => {
    servicio.lunacion('2026-10-23').subscribe({ error: () => undefined });
    backend.expectOne((r) => r.url === URL).flush(null, { status: 500, statusText: 'Error' });

    servicio.lunacion('2026-10-23').subscribe();
    backend.expectOne((r) => r.url === URL).flush(lunacionDePrueba());
  });

  it('el índice de métonos se pide una sola vez', () => {
    servicio.metonos().subscribe();
    servicio.metonos().subscribe();
    backend.expectOne(`${environment.apiBaseUrl}/calendario/metonos`).flush([]);
  });
});
