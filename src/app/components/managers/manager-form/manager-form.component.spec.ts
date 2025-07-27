import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ManagerFormComponent } from './manager-form.component';

describe('ManagerFormComponent', () => {
  let component: ManagerFormComponent;
  let fixture: ComponentFixture<ManagerFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ManagerFormComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ManagerFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
