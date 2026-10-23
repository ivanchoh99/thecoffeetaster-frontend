import type { NgxEditorJsBlock } from '@tmdjr/ngx-editor-js2';

export type BlogPostStatus = 'draft' | 'published';

export interface BlogPostMeta {
  title: string;
  slug: string;
  excerpt: string;
  author: string;
  category: string;
  tags: string[];
  cover: string;
}

export interface BlogPost {
  id: string;
  meta: BlogPostMeta;
  blocks: NgxEditorJsBlock[];
  status: BlogPostStatus;
  createdAt: string;
  updatedAt: string;
}

export const BLOG_CATEGORIES = [
  'Historias',
  'Guías',
  'Recetas',
  'Cultivo',
  'Catas',
  'Editorial',
] as const;

export const EMPTY_META: BlogPostMeta = {
  title: '',
  slug: '',
  excerpt: '',
  author: 'Iván Carvajal',
  category: 'Historias',
  tags: [],
  cover: '☕',
};

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

export function blocksToPlainText(blocks: NgxEditorJsBlock[]): string {
  return blocks
    .map((block) => (block.dataClean ?? '').replace(/<[^>]*>/g, ' '))
    .join(' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function countWords(blocks: NgxEditorJsBlock[]): number {
  const text = blocksToPlainText(blocks);
  return text ? text.split(' ').length : 0;
}

export function estimateReadTime(blocks: NgxEditorJsBlock[]): number {
  return Math.max(1, Math.ceil(countWords(blocks) / 200));
}

export function createEmptyBlocks(): NgxEditorJsBlock[] {
  return [
    {
      blockId: `block-${Date.now()}`,
      sortIndex: 0,
      componentInstanceName: 'TextBlockComponent',
      savedAction: 'title-medium',
      dataClean: '',
    },
  ];
}
