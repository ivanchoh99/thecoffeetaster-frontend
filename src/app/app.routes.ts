import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./page/home/home').then(m => m.Home)
    }, {
        path: 'en-construccion',
        loadComponent: () => import('./page/building/building').then(m => m.Building)
    }, {
        path: 'preview',
        loadComponent: () => import('./page/preview/preview').then(m => m.Preview)
    }, {
        path: 'blog/:slug',
        loadComponent: () => import('./page/blog-post/blog-post').then(m => m.BlogPost)
    }, {
        path: '**',
        redirectTo: ''
    }
];
