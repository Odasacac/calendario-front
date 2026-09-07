import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { DownloadService } from './download.service';

describe('DownloadService', () => {
  let service: DownloadService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(DownloadService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('se crea', () => {
    expect(service).toBeTruthy();
  });

  it('usa el nombre de Content-Disposition cuando el backend lo envía', () => {
    let nombre = '';
    service.getPDF().subscribe((fichero) => (nombre = fichero.nombre));

    http.expectOne((r) => r.url.endsWith('/getpdf')).flush(new Blob(['x']), {
      headers: { 'Content-Disposition': 'attachment; filename="manual-vau.pdf"' },
    });

    expect(nombre).toBe('manual-vau.pdf');
  });
});
