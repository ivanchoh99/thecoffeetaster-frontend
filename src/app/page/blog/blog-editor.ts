import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Header } from '../../components/header/header';

/**
 * Marcador de posición de la creación de una entrada del blog.
 * La pantalla real de edición pertenece a la feature del blog;
 * aquí solo se protege la ruta (RN-09).
 */
@Component({
  selector: 'app-blog-editor',
  imports: [Header],
  templateUrl: './blog-editor.html',
  styleUrl: './blog-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogEditor {
  protected readonly title = 'Editor de entradas';
  protected readonly description =
    'Pantalla reservada para la feature del blog. Ruta protegida: requiere sesión activa.';
}
