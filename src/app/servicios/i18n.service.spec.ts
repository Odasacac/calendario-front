import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;

  beforeEach(() => {
    localStorage.removeItem('vau.idioma');
    TestBed.configureTestingModule({});
    service = TestBed.inject(I18nService);
  });

  it('traduce claves con notación de puntos', () => {
    service.cambiar('es');
    expect(service.t('comun.reintentar')).toBe('Reintentar');
  });

  it('cambia de idioma y actualiza el locale', () => {
    service.cambiar('en');
    expect(service.t('comun.reintentar')).toBe('Retry');
    expect(service.locale()).toBe('en-GB');
  });

  it('sustituye los parámetros del texto', () => {
    service.cambiar('es');
    expect(service.t('descargas.exito', { fichero: 'manual.pdf' })).toContain(
      'manual.pdf',
    );
  });
});
