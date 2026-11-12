import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Header } from '../../components/header/header';

/**
 * Índice público del blog. Marcador de posición hasta que la feature del
 * blog aporte el listado real de entradas.
 */
@Component({
  selector: 'app-blog-index',
  imports: [Header],
  templateUrl: './blog-index.html',
  styleUrl: './blog-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogIndex {
  protected readonly title = 'Blog';
  protected readonly description =
    'Ruta pública del blog. El contenido real llega con la feature del blog.';
}
