import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { NgxEditorJs2Component, NgxEditorJsBlock } from '@tmdjr/ngx-editor-js2';
import { Observable } from 'rxjs';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-blog-editor',
  imports: [Header, MatButtonModule, NgxEditorJs2Component],
  templateUrl: './blog-editor.html',
  styleUrl: './blog-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogEditor {
  protected readonly js2Blocks: NgxEditorJsBlock[] = [
    {
      blockId: 'js2-1',
      sortIndex: 0,
      componentInstanceName: 'TextBlockComponent',
      savedAction: 'title-medium',
      dataClean: '☕ Escribe tu entrada',
    },
    {
      blockId: 'js2-2',
      sortIndex: 1,
      componentInstanceName: 'TextBlockComponent',
      savedAction: 'large',
      dataClean:
        'Editor por bloques: arrastra los bloques para reordenarlos y usa los controles de cada bloque para modificar su estilo.',
    },
    {
      blockId: 'js2-3',
      sortIndex: 2,
      componentInstanceName: 'QuoteBlockComponent',
      savedAction: 'quote',
      dataClean:
        '“El café debe ser oscuro como la noche, dulce como el amor y caliente como el infierno.”',
    },
    {
      blockId: 'js2-4',
      sortIndex: 3,
      componentInstanceName: 'ListBlockComponent',
      savedAction: 'ul',
      dataClean: '<li>Origen único de montaña.</li><li>Mezcla de la casa.</li>',
    },
    {
      blockId: 'js2-5',
      sortIndex: 4,
      componentInstanceName: 'TableBlockComponent',
      savedAction: 'table',
      dataClean:
        '<tbody><tr><td>Origen</td><td>Tueste</td><td>Notas</td></tr><tr><td>Etiopía</td><td>Medio</td><td>Cítricos</td></tr><tr><td>Colombia</td><td>Oscuro</td><td>Cacao</td></tr></tbody>',
    },
  ];

  protected js2RequestNonce = 0;
  protected readonly js2Output = signal('');

  protected requestJs2Blocks(): void {
    this.js2RequestNonce++;
  }

  protected onJs2BlocksRequested(blocks$: Observable<NgxEditorJsBlock[]>): void {
    blocks$.subscribe((blocks) => {
      this.js2Output.set(JSON.stringify(blocks, null, 2));
    });
  }

  protected onJs2FormChanged(blocks: NgxEditorJsBlock[]): void {
    this.js2Output.set(JSON.stringify(blocks, null, 2));
  }
}
