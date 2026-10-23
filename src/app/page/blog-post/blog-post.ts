import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Header } from '../../components/header/header';

interface PostList {
  label: string;
  items: string[];
}

interface PostTable {
  caption: string;
  columns: string[];
  rows: string[][];
}

interface PostSection {
  heading: string;
  paragraphs: string[];
  list?: PostList;
  quote?: string;
  table?: PostTable;
}

interface Post {
  category: string;
  title: string;
  subtitle: string;
  date: string;
  author: string;
  readTime: string;
  cover: string;
  intro: string[];
  sections: PostSection[];
  closing: string;
  tags: string[];
}

@Component({
  selector: 'app-blog-post',
  imports: [Header],
  templateUrl: './blog-post.html',
  styleUrl: './blog-post.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class BlogPost {
  protected readonly post: Post = {
    category: 'Historias',
    title: 'La voz del café: historias que caben en una taza',
    subtitle:
      'Detrás de cada taza hay una región, una familia y un trabajo que rara vez cuenta su propia historia.',
    date: '12 de marzo de 2026',
    author: 'Iván Carvajal',
    readTime: '6 min de lectura',
    cover: '☕',
    intro: [
      'En el café hay dos historias: la que se ve en la bolsa y la que se cuenta en la montaña. Esta es una invitación a escuchar la segunda.',
      'Escribo desde Huila, donde el café no es un producto de estante sino un vecino, un suelo y un calendario.',
    ],
    sections: [
      {
        heading: 'El café no se cose solo',
        paragraphs: [
          'Detrás de la etiqueta de cualquier bolsa hay manos que miden madurez sin reloj, que saben el día exacto en el que un grano está listo antes de mirar el calendario.',
          'Conocer esa parte cambió la manera en la que tomo café: ya no es solo un sabor, es el resultado de un oficio que se aprende durante generaciones.',
        ],
      },
      {
        heading: 'Tres preguntas para acercarte a lo que compras',
        paragraphs: [
          'No hacen falta tablas ni catas para empezar a comprar con criterio. Basta con preguntar y escuchar.',
        ],
        list: {
          label: 'Preguntas que abren conversaciones',
          items: [
            '¿De qué departamento o finca viene este café?',
            '¿Qué proceso se usó en el beneficio?',
            '¿Quién lo tostó y hace cuánto?',
          ],
        },
      },
      {
        heading: 'Lo que dice un productor',
        paragraphs: [
          'Hablé con un caficultor de la zona. No habló de puntajes ni de ruedas de sabores: habló de clima, de hijos y de orgullo.',
        ],
        quote: 'Cuando la taza llega a otra mesa y alguien dice "qué rico café", lo primero que pienso es en el trabajo de todo el año.',
      },
      {
        heading: 'Una historia que se cuenta en personas',
        paragraphs: [
          'El café de especialidad suele contarse con cifras y técnicas. Acá prefiero contarlo como lo que es: un oficio que sostiene a una comunidad.',
          'Cada taza que compramos decide qué historia se cuenta, y a quién.',
        ],
      },
    ],
    closing:
      'Este espacio seguirá contando estas historias: las de la montaña, las de los productores y las de quienes empiezan a descubrir el café.',
    tags: ['Huila', 'Productores', 'Cultura', 'Editorial'],
  };
}