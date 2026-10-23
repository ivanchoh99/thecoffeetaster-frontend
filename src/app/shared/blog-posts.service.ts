import { Injectable, signal } from '@angular/core';
import type { BlogPost } from './blog-post.model';

@Injectable({ providedIn: 'root' })
export class BlogPostsService {
  private readonly storageKey = 'tct.blog.posts';
  private readonly postsSignal = signal<BlogPost[]>(this.readFromStorage());
  readonly posts = this.postsSignal.asReadonly();

  find(id: string): BlogPost | undefined {
    return this.postsSignal().find((post) => post.id === id);
  }

  save(post: BlogPost): void {
    const posts = this.postsSignal();
    const index = posts.findIndex((item) => item.id === post.id);
    const next = [...posts];
    if (index >= 0) {
      next[index] = post;
    } else {
      next.push(post);
    }
    this.postsSignal.set(next);
    this.writeToStorage(next);
  }

  remove(id: string): void {
    const next = this.postsSignal().filter((post) => post.id !== id);
    this.postsSignal.set(next);
    this.writeToStorage(next);
  }

  private readFromStorage(): BlogPost[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return [];
      }
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as BlogPost[]) : [];
    } catch {
      return [];
    }
  }

  private writeToStorage(posts: BlogPost[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(posts));
    } catch {
      // Sin espacio o almacenamiento bloqueado: la copia en memoria sigue viva.
    }
  }
}
