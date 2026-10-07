import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./page/home/home').then(m => m.Home)
    }, {
        path: 'en-construccion',
        loadComponent: () => import('./page/building/building').then(m => m.Building)
    }, {
        path: '**',
        redirectTo: ''
    }
];
