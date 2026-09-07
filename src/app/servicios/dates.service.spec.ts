import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DatesService } from './dates.service';

describe('DatesService', () => {
  let service: DatesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DatesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('se crea', () => {
    expect(service).toBeTruthy();
  });

  it('pide la fecha seleccionada como parámetro de consulta', () => {
    service.getVAU('2025-01-31').subscribe();
    const peticion = http.expectOne((r) => r.url.endsWith('/conversiontovau/selected'));
    expect(peticion.request.params.get('date')).toBe('2025-01-31');
    peticion.flush({});
  });

  it('no repite la llamada para una fecha ya cacheada', () => {
    service.getVAU('2025-02-01').subscribe();
    const peticion = http.expectOne((r) => r.url.endsWith('/conversiontovau/selected'));
    peticion.flush({});

    service.getVAU('2025-02-01').subscribe();
    const repetidas = http.match((r) => r.url.endsWith('/conversiontovau/selected'));
    expect(repetidas.length).toBe(0);
  });
});
