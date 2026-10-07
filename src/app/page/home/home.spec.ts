import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Home } from './home';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the three main sections', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('TheCoffeeTaster');
    expect(text).toContain('Propósito');
    expect(text).toContain('Quién soy');
    expect(text).toContain('A futuro');
  });

  it('should mention registro sencillo y compartir', () => {
    const text = (fixture.nativeElement.textContent as string).toLowerCase();
    expect(text).toContain('marcas');
    expect(text).toContain('variedades');
    expect(text).toContain('compartir');
  });
});
