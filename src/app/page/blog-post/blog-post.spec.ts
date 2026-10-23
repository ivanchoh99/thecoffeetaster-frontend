import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BlogPost } from './blog-post';

describe('BlogPost', () => {
  let component: BlogPost;
  let fixture: ComponentFixture<BlogPost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlogPost],
      providers: [provideRouter([])]
    })
      .compileComponents();

    fixture = TestBed.createComponent(BlogPost);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the post title', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('La voz del café');
  });

  it('should render headings, a quote and a list', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('El café no se cose solo');
    expect(text).toContain('Lo que dice un productor');
    expect(text).toContain('Tres preguntas');
  });
});