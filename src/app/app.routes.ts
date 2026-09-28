import { Routes } from '@angular/router';

export const routes: Routes = [
    {
        path: '',
        loadComponent: () => import('./page/building/building').then(m => m.Building)
    }, {
        path: '**',
        redirectTo: ''
    }
];
