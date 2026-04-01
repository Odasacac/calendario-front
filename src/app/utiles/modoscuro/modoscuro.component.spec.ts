import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModoscuroComponent } from './modoscuro.component';

describe('ModoscuroComponent', () => {
  let component: ModoscuroComponent;
  let fixture: ComponentFixture<ModoscuroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModoscuroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ModoscuroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
