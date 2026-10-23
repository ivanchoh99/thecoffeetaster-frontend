import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { NgxEditorJsBlock } from '@tmdjr/ngx-editor-js2';
import { estimateReadTime, type BlogPostMeta } from '../blog-post.model';

const HEADING_TAGS: Record<string, string> = {
  'title-large': 'h2',
  'title-medium': 'h3',
  'title-small': 'h4',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
};

@Component({
  selector: 'app-post-preview',
  templateUrl: './post-preview.html',
  styleUrl: './post-preview.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostPreview {
  readonly meta = input.required<BlogPostMeta>();
  readonly blocks = input.required<NgxEditorJsBlock[]>();
  readonly date = input<string>('');

  readonly isImageCover = computed(() => /^(https?:|data:image|\/)/.test(this.meta().cover));
  readonly readTime = computed(() => estimateReadTime(this.blocks()));
  readonly tags = computed(() => this.meta().tags.filter((tag) => tag.length > 0));
  readonly articleHtml = computed(() =>
    this.blocks()
      .map((block) => this.renderBlock(block))
      .filter((html) => html.length > 0)
      .join('\n'),
  );
  readonly dateLabel = computed(() => {
    const raw = this.date();
    const date = raw ? new Date(raw) : new Date();
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  });

  private renderBlock(block: NgxEditorJsBlock): string {
    const data = block.dataClean ?? '';
    if (!data.trim()) {
      return '';
    }
    const action = block.savedAction ?? '';

    switch (block.componentInstanceName) {
      case 'HeaderBlockComponent':
        return this.renderText(data, HEADING_TAGS[action] ?? 'h2');
      case 'ParagraphBlockComponent':
        return `<p class="preview-text">${data}</p>`;
      case 'TextBlockComponent':
        return this.renderText(data, HEADING_TAGS[action]);
      case 'QuoteBlockComponent':
        return `<blockquote class="preview-quote${action === 'featured' ? ' is-featured' : ''}">${data}</blockquote>`;
      case 'ListBlockComponent': {
        const tag = action === 'ol' ? 'ol' : 'ul';
        return `<${tag} class="preview-list">${data}</${tag}>`;
      }
      case 'TableBlockComponent':
        return `<div class="preview-table"><table>${data}</table></div>`;
      default:
        return `<div class="preview-text">${data}</div>`;
    }
  }

  private renderText(data: string, heading?: string): string {
    if (heading) {
      return `<${heading} class="preview-heading">${data}</${heading}>`;
    }
    return `<p class="preview-text">${data}</p>`;
  }
}
