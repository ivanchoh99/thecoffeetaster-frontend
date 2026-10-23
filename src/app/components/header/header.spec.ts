import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render centered brand link', () => {
    const el = fixture.nativeElement as HTMLElement;
    const link = el.querySelector('.brand');
    expect(link?.getAttribute('aria-label')).toContain('TheCoffeeTaster');
    expect(el.querySelector('.wordmark')?.textContent).toContain('TheCoffeeTaster');
  });
});
