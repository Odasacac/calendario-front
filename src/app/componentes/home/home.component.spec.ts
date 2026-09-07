import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { HomeComponent } from './home.component';
import { UsuarioService } from '../../servicios/usuario.service';

describe('HomeComponent', () => {
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    TestBed.inject(UsuarioService).setEsInvitado(true);

    fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
  });

  it('se crea', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('arranca en la vista de fecha VAU y en el día de hoy', () => {
    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('app-date-vau')).not.toBeNull();
    expect(elemento.querySelector('app-descargas')).toBeNull();
  });
});
