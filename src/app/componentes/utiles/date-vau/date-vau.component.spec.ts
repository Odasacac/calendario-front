import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DateVAUComponent } from './date-vau.component';

describe('DateVAUComponent', () => {
  let fixture: ComponentFixture<DateVAUComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateVAUComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DateVAUComponent);
    fixture.detectChanges();
  });

  it('se crea', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('muestra el esqueleto de carga mientras espera a la API', () => {
    const elemento = fixture.nativeElement as HTMLElement;
    expect(elemento.querySelector('.esqueleto')).not.toBeNull();
  });
});
