import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { authInterceptor } from '../../../guardias/auth.interceptor';
import { UsuarioService } from '../../../servicios/usuario.service';
import { sesionDePrueba } from '../../../testing/datos-usuario';
import { CalendarioComponent } from './calendario.component';

describe('CalendarioComponent', () => {
  let fixture: ComponentFixture<CalendarioComponent>;
  let elemento: HTMLElement;

  function crear(seleccionada: string): void {
    fixture = TestBed.createComponent(CalendarioComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('seleccionada', seleccionada);
    fixture.detectChanges();
  }

  function dia(iso: string): HTMLButtonElement {
    return elemento.querySelector<HTMLButtonElement>(`[data-dia="${iso}"]`)!;
  }

  function diasDelMes(): string[] {
    return Array.from(elemento.querySelectorAll('.dia:not(.fuera)')).map((b) => b.textContent!.trim());
  }

  beforeEach(async () => {
    sessionStorage.removeItem('vau.sesion');
    await TestBed.configureTestingModule({
      imports: [CalendarioComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  it('empieza la semana en lunes y siempre pinta 6 semanas', () => {
    crear('2026-10-23');
    const cabeceras = Array.from(elemento.querySelectorAll('th')).map((th) => th.textContent!.trim());
    expect(cabeceras[0]).toBe('lun');
    expect(cabeceras[6]).toBe('dom');
    expect(elemento.querySelectorAll('tbody tr').length).toBe(6);
    // Octubre de 2026 empieza en jueves: la primera fila arranca el lunes 28 de septiembre.
    expect(elemento.querySelector('tbody tr td button')!.getAttribute('data-dia')).toBe('2026-09-28');
  });

  it('marca el día elegido y respeta los años bisiestos', () => {
    crear('2027-02-10');
    expect(dia('2027-02-10').classList).toContain('elegido');
    expect(diasDelMes().length).toBe(28);

    crear('2028-02-10');
    expect(diasDelMes().length).toBe(29);
  });

  it('al pulsar un día lo emite', () => {
    crear('2026-10-23');
    let elegido = '';
    fixture.componentInstance.seleccionar.subscribe((iso) => (elegido = iso));

    dia('2026-10-05').click();
    expect(elegido).toBe('2026-10-05');
  });

  it('las flechas de mes cambian el mes mostrado', () => {
    crear('2026-01-31');
    const siguiente = elemento.querySelector<HTMLButtonElement>('[aria-label="Mes siguiente"]')!;
    siguiente.click();
    fixture.detectChanges();

    // 31 de enero + 1 mes = último día de febrero.
    expect(dia('2026-02-28').getAttribute('tabindex')).toBe('0');
    expect(elemento.querySelector<HTMLSelectElement>('#calendario-mes')!.value).toBe('1');
  });

  it('se navega con el teclado y Enter elige', fakeAsync(() => {
    crear('2026-10-23');
    tick();
    let elegido = '';
    fixture.componentInstance.seleccionar.subscribe((iso) => (elegido = iso));

    dia('2026-10-23').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    fixture.detectChanges();
    tick();
    expect(document.activeElement).toBe(dia('2026-10-30'));

    dia('2026-10-30').dispatchEvent(new KeyboardEvent('keydown', { key: 'PageDown' }));
    fixture.detectChanges();
    tick();
    expect(document.activeElement).toBe(dia('2026-11-30'));

    dia('2026-11-30').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(elegido).toBe('2026-11-30');
  }));

  it('no deja pasar de 2099', () => {
    crear('2099-12-15');
    expect(elemento.querySelector<HTMLButtonElement>('[aria-label="Mes siguiente"]')!.disabled).toBeTrue();
  });

  it('para un usuario registrado marca los días con acontecimiento', () => {
    TestBed.inject(UsuarioService).iniciarSesion(sesionDePrueba());
    crear('2026-10-23');
    TestBed.inject(HttpTestingController)
      .expectOne(`${environment.apiBaseUrl}/usuarios/me/acontecimientos/fechas`)
      .flush(['2026-10-12']);
    fixture.detectChanges();

    expect(dia('2026-10-12').classList).toContain('marcado');
    expect(dia('2026-10-12').getAttribute('aria-label')).toContain('Tienes un acontecimiento destacado');
    expect(dia('2026-10-13').classList).not.toContain('marcado');
  });

  it('un invitado no pide acontecimientos', () => {
    crear('2026-10-23');
    TestBed.inject(HttpTestingController).expectNone(`${environment.apiBaseUrl}/usuarios/me/acontecimientos/fechas`);
  });
});
