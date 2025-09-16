import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserBooking } from './user-booking';

describe('UserBooking', () => {
  let component: UserBooking;
  let fixture: ComponentFixture<UserBooking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserBooking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserBooking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
