import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { Navbar } from '../../components/navbar/navbar';
import { Header } from '../../components/header/header';

interface Pillar {
  index: string;
  title: string;
  text: string;
}

interface Goal {
  title: string;
  text: string;
  status: string;
}

@Component({
  selector: 'app-home',
  imports: [MatButtonModule, MatCardModule, Header],
  templateUrl: './home.html',
  styleUrl: './home.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  readonly currentYear = new Date().getFullYear();

  readonly pillars: Pillar[] = [
    {
      index: '01',
      title: 'Marcas y tostadores',
      text: 'Quién lo tuesta, de dónde viene y su historia. Lo esencial para volver a comprar con criterio.',
    },
    {
      index: '02',
      title: 'Cafés y variedades',
      text: 'Origen, variedad, proceso y notas percibidas. Registro simple, sin jerga innecesaria.',
    },
    {
      index: '03',
      title: 'Formas de preparación',
      text: 'Método, dosis, agua, molienda y tiempo. Parámetros mínimos para repetir una buena taza.',
    },
    {
      index: '04',
      title: 'Registro para compartir',
      text: 'Un formato claro que cualquiera puede replicar y compartir con otros que están empezando.',
    },
  ];

  readonly goals: Goal[] = [
    {
      title: 'Catálogo interactivo',
      text: 'Explorador de marcas, bolsas, variedades y métodos con fichas claras y filtros pensados para principiantes.',
      status: 'Próximamente',
    },
    {
      title: 'Bitácora técnica (Brew Logs)',
      text: 'Diario de cata con dosis, ratio, temperatura y tiempos, más rueda de sabores y notas personales.',
      status: 'Próximamente',
    },
    {
      title: 'Comunidad y recetas',
      text: 'Publica tu receta, comenta la de otros, marca “lo probé” y arma tu lista de cafés por probar.',
      status: 'Próximamente',
    },
    {
      title: 'Progreso y niveles',
      text: 'Niveles desde Aficionado hasta Master Brew, XP por registrar catas e insignias por métodos y orígenes.',
      status: 'Próximamente',
    },
  ];
}
