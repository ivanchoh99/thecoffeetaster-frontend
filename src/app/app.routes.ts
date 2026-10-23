import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./page/home/home').then(m => m.Home)
    }, {
        path: 'blog/editor',
        loadComponent: () => import('./page/blog-editor/blog-editor').then(m => m.BlogEditor)
    }, {
        path: 'blog',
        loadComponent: () => import('./page/blog-post/blog-post').then(m => m.BlogPost)
    }, {
        path: '**',
        redirectTo: ''
    }
];
