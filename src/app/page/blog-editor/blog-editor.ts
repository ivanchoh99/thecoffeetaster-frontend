import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxEditorJs2Component, type NgxEditorJsBlock } from '@tmdjr/ngx-editor-js2';
import { firstValueFrom, map } from 'rxjs';
import { Header } from '../../components/header/header';
import {
  BLOG_CATEGORIES,
  EMPTY_META,
  buildExcerpt,
  countWords,
  createEmptyBlocks,
  estimateReadTime,
  parseTags,
  slugify,
  type BlogPost,
  type BlogPostMeta,
  type BlogPostStatus,
} from '../../shared/blog-post.model';
import { BlogPostsService } from '../../shared/blog-posts.service';
import { CoverPicker } from '../../shared/cover-picker/cover-picker';
import { PostPreview } from '../../shared/post-preview/post-preview';

interface EditorMessage {
  type: 'ok' | 'error';
  text: string;
}

@Component({
  selector: 'app-blog-editor',
  imports: [
    Header,
    ReactiveFormsModule,
    MatButtonModule,
    MatOptionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgxEditorJs2Component,
    CoverPicker,
    PostPreview,
  ],
  templateUrl: './blog-editor.html',
  styleUrl: './blog-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogEditor {
  private readonly formBuilder = inject(FormBuilder);
  private readonly postsService = inject(BlogPostsService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly categories = BLOG_CATEGORIES;
  protected readonly form = this.formBuilder.nonNullable.group({
    title: ['', Validators.required],
    excerpt: [''],
    author: [EMPTY_META.author],
    category: [EMPTY_META.category],
    tags: [''],
    cover: [EMPTY_META.cover],
  });

  private readonly slug = signal('');
  private readonly formValue = toSignal(
    this.form.valueChanges.pipe(map(() => this.form.getRawValue())),
    { initialValue: this.form.getRawValue() },
  );
  protected readonly meta = computed<BlogPostMeta>(() => ({
    title: this.formValue().title,
    slug: this.slug(),
    excerpt: this.formValue().excerpt,
    author: this.formValue().author,
    category: this.formValue().category,
    tags: parseTags(this.formValue().tags),
    cover: this.formValue().cover || EMPTY_META.cover,
  }));

  protected readonly editor = viewChild(NgxEditorJs2Component);
  protected readonly initialBlocks = signal<NgxEditorJsBlock[]>(createEmptyBlocks());
  protected readonly currentBlocks = signal<NgxEditorJsBlock[]>(this.initialBlocks());
  protected readonly blocksRequest = signal(0);
  protected readonly wordCount = computed(() => countWords(this.currentBlocks()));
  protected readonly readTime = computed(() => estimateReadTime(this.currentBlocks()));
  protected readonly savedPosts = computed(() =>
    [...this.postsService.posts()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );
  protected readonly status = signal<BlogPostStatus>('draft');
  protected readonly message = signal<EditorMessage | null>(null);

  private postId = createId();
  private createdAt = new Date().toISOString();

  constructor() {
    this.form.controls.title.valueChanges.subscribe((title) => {
      this.slug.set(slugify(title));
    });
    this.loadFromQuery();
  }

  protected onFormChanged(blocks: NgxEditorJsBlock[]): void {
    this.currentBlocks.set(blocks);
  }

  protected async saveDraft(): Promise<void> {
    await this.persist('draft');
  }

  protected async publish(): Promise<void> {
    if (!this.form.controls.title.value.trim()) {
      this.showError('Ponle un título a la entrada antes de publicar.');
      return;
    }
    if (this.wordCount() === 0) {
      this.showError('Añade algo de contenido antes de publicar.');
      return;
    }
    await this.persist('published');
  }

  protected newEntry(): void {
    const hasChanges =
      this.form.controls.title.value.trim().length > 0 || this.wordCount() > 0;
    if (
      hasChanges &&
      typeof window !== 'undefined' &&
      !window.confirm('¿Empezar una entrada nueva? Los cambios sin guardar se perderán.')
    ) {
      return;
    }
    this.resetEntry();
  }

  protected openPost(post: BlogPost): void {
    this.applyPost(post);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { post: post.id },
      replaceUrl: true,
    });
  }

  protected removePost(post: BlogPost): void {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(`¿Eliminar "${post.meta.title || 'Sin título'}"?`)
    ) {
      return;
    }
    this.postsService.remove(post.id);
    if (post.id === this.postId) {
      this.resetEntry();
    }
  }

  protected formatDate(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '';
    }
    return new Intl.DateTimeFormat('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  }

  private resetEntry(): void {
    this.postId = createId();
    this.createdAt = new Date().toISOString();
    this.slug.set('');
    this.form.reset({
      title: '',
      excerpt: '',
      author: EMPTY_META.author,
      category: EMPTY_META.category,
      tags: '',
      cover: EMPTY_META.cover,
    });
    this.setBlocks(createEmptyBlocks());
    this.status.set('draft');
    this.message.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true,
    });
  }

  private async persist(status: BlogPostStatus): Promise<void> {
    const title = this.form.controls.title.value.trim();
    if (!title) {
      this.showError('Añade un título para guardar la entrada.');
      return;
    }

    const blocks = await this.snapshotBlocks();
    const excerpt =
      this.form.controls.excerpt.value.trim() || buildExcerpt(blocks);
    if (excerpt && !this.form.controls.excerpt.value.trim()) {
      this.form.controls.excerpt.setValue(excerpt);
    }
    const meta: BlogPostMeta = {
      ...this.meta(),
      title,
      excerpt,
      slug: this.slug() || slugify(title),
    };

    const post: BlogPost = {
      id: this.postId,
      meta,
      blocks,
      status,
      createdAt: this.createdAt,
      updatedAt: new Date().toISOString(),
    };
    const saved = this.postsService.save(post);
    this.status.set(status);
    this.message.set(
      saved
        ? {
            type: 'ok',
            text: status === 'published' ? 'Entrada publicada.' : 'Borrador guardado.',
          }
        : {
            type: 'error',
            text: 'No se pudo guardar: puede que la imagen ocupe demasiado. Prueba con una más pequeña.',
          },
    );
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { post: this.postId },
      replaceUrl: true,
    });
  }

  private async snapshotBlocks(): Promise<NgxEditorJsBlock[]> {
    const editor = this.editor();
    if (editor) {
      try {
        const blocks = await firstValueFrom(editor.editorJsService.getBlocks$());
        this.currentBlocks.set(blocks);
        return blocks;
      } catch {
        // Si el editor aún no está listo usamos el último estado conocido.
      }
    }
    return this.currentBlocks();
  }

  private loadFromQuery(): void {
    const id = this.route.snapshot.queryParamMap.get('post');
    if (!id) {
      return;
    }
    const post = this.postsService.find(id);
    if (!post) {
      this.showError('No se encontró la entrada solicitada.');
      return;
    }

    this.applyPost(post);
  }

  private applyPost(post: BlogPost): void {
    this.postId = post.id;
    this.createdAt = post.createdAt;
    this.status.set(post.status);
    this.form.patchValue({
      title: post.meta.title,
      excerpt: post.meta.excerpt,
      author: post.meta.author,
      category: post.meta.category,
      tags: post.meta.tags.join(', '),
      cover: post.meta.cover,
    });
    this.slug.set(post.meta.slug);
    this.setBlocks(post.blocks);
    this.message.set(null);
  }

  private setBlocks(blocks: NgxEditorJsBlock[]): void {
    const copy = blocks.map((block) => ({ ...block }));
    this.initialBlocks.set(copy);
    this.currentBlocks.set(copy);
  }

  private showError(text: string): void {
    this.message.set({ type: 'error', text });
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
