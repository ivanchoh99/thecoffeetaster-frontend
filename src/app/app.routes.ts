import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./page/home/home').then(m => m.Home),
  },
  {
    // Ruta de autenticación: solo para invitados (RN-19).
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./page/login/login').then(m => m.Login),
  },
  {
    // Rutas protegidas: se declaran antes que `/blog/:slug` (RN-22).
    path: 'blog/editar',
    canActivate: [authGuard],
    loadComponent: () => import('./page/blog/blog-editor').then(m => m.BlogEditor),
  },
  {
    path: 'blog/editar/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./page/blog/blog-editor').then(m => m.BlogEditor),
  },
  {
    path: 'blog/preview/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./page/blog/blog-preview').then(m => m.BlogPreview),
  },
  {
    path: 'blog',
    loadComponent: () => import('./page/blog/blog-index').then(m => m.BlogIndex),
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./page/blog-post/blog-post').then(m => m.BlogPost),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
