import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Preview } from './preview';

describe('Preview', () => {
  let component: Preview;
  let fixture: ComponentFixture<Preview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Preview],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Preview);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
