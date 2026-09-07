import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DescargasComponent } from './descargas.component';

describe('DescargasComponent', () => {
  let fixture: ComponentFixture<DescargasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DescargasComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(DescargasComponent);
    fixture.detectChanges();
  });

  it('se crea', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
