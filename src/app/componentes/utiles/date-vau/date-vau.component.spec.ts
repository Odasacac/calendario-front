import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateVAUComponent } from './date-vau.component';

describe('DateVAUComponent', () => {
  let component: DateVAUComponent;
  let fixture: ComponentFixture<DateVAUComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DateVAUComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DateVAUComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
