import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Building } from './building';

describe('Building', () => {
  let component: Building;
  let fixture: ComponentFixture<Building>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Building],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Building);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
