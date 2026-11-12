import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { Header } from '../../components/header/header';

/**
 * Marcador de posición del preview de una entrada del blog.
 * La pantalla real de preview pertenece a la feature del blog;
 * aquí solo se protege la ruta (RN-09).
 */
@Component({
  selector: 'app-blog-preview',
  imports: [Header],
  templateUrl: './blog-preview.html',
  styleUrl: './blog-placeholder.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPreview {
  private readonly route = inject(ActivatedRoute);

  protected readonly title = 'Preview de la entrada';
  protected readonly description =
    'Pantalla reservada para la feature del blog. Ruta protegida: requiere sesión activa.';

  protected readonly entryId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );
}
