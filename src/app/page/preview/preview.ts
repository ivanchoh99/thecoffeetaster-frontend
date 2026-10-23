import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { NgxEditorJs2Component, NgxEditorJsBlock } from '@tmdjr/ngx-editor-js2';
import { Editor, NgxEditorModule } from 'ngx-editor';
import { Observable } from 'rxjs';
import { Header } from '../../components/header/header';

@Component({
  selector: 'app-preview',
  imports: [
    Header,
    FormsModule,
    MatButtonModule,
    NgxEditorJs2Component,
    NgxEditorModule,
  ],
  templateUrl: './preview.html',
  styleUrl: './preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Preview implements OnInit, OnDestroy {
  protected ngxEditor: Editor | null = null;
  protected ngxHtml: string =
    '<p>Hola, <b>TheCoffeeTaster</b>! Esta es la demo de <b>NgxEditor</b>, el editor enriquecido de ProseMirror.</p>' +
    '<p>Prueba a escribir, marcar <i>itálicas</i> o insertar una cita.</p>';

  protected readonly js2Blocks: NgxEditorJsBlock[] = [
    {
      blockId: 'js2-1',
      sortIndex: 0,
      componentInstanceName: 'HeaderBlockComponent',
      savedAction: 'h2',
      dataClean: '☕ NgxEditorJs2',
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

  ngOnInit(): void {
    this.ngxEditor = new Editor();
  }

  ngOnDestroy(): void {
    this.ngxEditor?.destroy();
    this.ngxEditor = null;
  }

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