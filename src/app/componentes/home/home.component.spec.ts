import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { UsuarioService } from '../../servicios/usuario.service';
import { sesionDePrueba } from '../../testing/datos-usuario';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;
  let elemento: HTMLElement;

  async function crear(seccion?: string): Promise<void> {
    fixture = TestBed.createComponent(HomeComponent);
    elemento = fixture.nativeElement as HTMLElement;
    if (seccion) {
      fixture.componentRef.setInput('seccion', seccion);
    }
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    sessionStorage.removeItem('vau.sesion');
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([{ path: 'home', children: [] }]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();
  });

  describe('como invitado', () => {
    beforeEach(async () => {
      TestBed.inject(UsuarioService).setEsInvitado(true);
      await crear();
    });

    it('se crea', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('arranca en la vista de fecha VAU y en el día de hoy', () => {
      expect(elemento.querySelector('app-date-vau')).not.toBeNull();
      expect(elemento.querySelector('app-descargas')).toBeNull();
      expect(elemento.querySelector('.estado')!.textContent).toContain('Hoy');
    });

    it('el chip «Hoy» solo aparece en la fecha VAU', async () => {
      await crear('descargas');
      expect(elemento.querySelector('app-descargas')).not.toBeNull();
      expect(elemento.querySelector('.estado')!.textContent!.trim()).toBe('');
    });

    it('no puede abrir «Mi cuenta» aunque lo pida la URL', async () => {
      await crear('cuenta');
      expect(elemento.querySelector('app-cuenta')).toBeNull();
      expect(elemento.querySelector('app-date-vau')).not.toBeNull();
    });

    it('el menú no ofrece las opciones de usuarios registrados', () => {
      (elemento.querySelector('.contenedor-menu button') as HTMLButtonElement).click();
      fixture.detectChanges();
      const textos = Array.from(elemento.querySelectorAll('[role="menuitem"]')).map((b) => b.textContent);
      expect(textos.join()).toContain('Descargar documentos');
      expect(textos.join()).not.toContain('Mi cuenta');
      expect(textos.join()).toContain('Calendario VAU');
    });

    it('puede abrir el Calendario VAU, sin el chip «Hoy» de la fecha VAU', async () => {
      await crear('calendario');
      expect(elemento.querySelector('app-calendario-vau')).not.toBeNull();
      expect(elemento.querySelector('.estado')!.textContent!.trim()).toBe('');
    });

    it('al abrir un día desde el calendario, la fecha VAU ofrece volver a él', async () => {
      await crear('calendario');
      fixture.componentInstance['abrirDiaDelCalendario']('2026-10-23');
      fixture.componentRef.setInput('seccion', undefined);
      fixture.detectChanges();

      expect(elemento.querySelector('app-date-vau')).not.toBeNull();
      expect(elemento.querySelector('.volver-calendario')!.textContent).toContain('Volver al calendario');
    });

    it('la posición del calendario no cambia al convertir una fecha en la fecha VAU', async () => {
      await crear();
      const posicion = fixture.componentInstance['fechaCalendario']();
      fixture.componentInstance['seleccionarFecha']('1999-01-01');
      expect(fixture.componentInstance['fechaCalendario']()).toBe(posicion);
    });
  });

  describe('como usuario registrado', () => {
    beforeEach(() => {
      TestBed.inject(UsuarioService).iniciarSesion(sesionDePrueba());
    });

    it('abre «Mi cuenta» con ?seccion=cuenta', async () => {
      await crear('cuenta');
      expect(elemento.querySelector('app-cuenta')).not.toBeNull();
    });

    it('abre los acontecimientos destacados con ?seccion=acontecimientos', async () => {
      await crear('acontecimientos');
      expect(elemento.querySelector('app-acontecimientos')).not.toBeNull();
    });
  });
});
