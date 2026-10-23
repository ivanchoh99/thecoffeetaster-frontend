import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';

type CoverMode = 'emoji' | 'image';

const IMAGE_PATTERN = /^(data:image|https?:|\/)/;

@Component({
  selector: 'app-cover-picker',
  imports: [MatButtonModule],
  templateUrl: './cover-picker.html',
  styleUrl: './cover-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CoverPicker),
      multi: true,
    },
  ],
})
export class CoverPicker implements ControlValueAccessor {
  protected readonly emojis = [
    '☕',
    '🫘',
    '🌱',
    '🌿',
    '🍫',
    '🥛',
    '🧋',
    '🫖',
    '🧉',
    '🏔️',
    '☀️',
    '🌧️',
    '🔥',
    '🍯',
    '🧁',
    '🫧',
  ];
  protected readonly mode = signal<CoverMode>('emoji');
  protected readonly value = signal('☕');
  protected readonly dragging = signal(false);
  protected readonly imageError = signal<string | null>(null);
  protected readonly disabled = signal(false);

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string | null): void {
    const next = value || '☕';
    this.value.set(next);
    this.mode.set(IMAGE_PATTERN.test(next) ? 'image' : 'emoji');
    this.imageError.set(null);
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected isImage(value: string): boolean {
    return IMAGE_PATTERN.test(value);
  }

  protected setMode(mode: CoverMode): void {
    if (this.disabled()) {
      return;
    }
    this.mode.set(mode);
    this.imageError.set(null);
    if (mode === 'emoji' && this.isImage(this.value())) {
      this.selectEmoji(this.emojis[0]);
    }
  }

  protected selectEmoji(emoji: string): void {
    if (this.disabled()) {
      return;
    }
    this.mode.set('emoji');
    this.value.set(emoji);
    this.imageError.set(null);
    this.onChange(emoji);
    this.onTouched();
  }

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      void this.readImage(file);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(true);
  }

  protected onDragLeave(): void {
    this.dragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      void this.readImage(file);
    }
  }

  protected clearImage(): void {
    this.selectEmoji(this.emojis[0]);
  }

  private async readImage(file: File): Promise<void> {
    this.imageError.set(null);
    if (!file.type.startsWith('image/')) {
      this.imageError.set('El archivo debe ser una imagen.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      this.imageError.set('La imagen supera los 8 MB.');
      return;
    }
    try {
      const dataUrl = await compressImage(file);
      this.mode.set('image');
      this.value.set(dataUrl);
      this.onChange(dataUrl);
      this.onTouched();
    } catch {
      this.imageError.set('No pudimos leer la imagen. Prueba con otra.');
    }
  }
}

async function compressImage(file: File, maxWidth = 1200, quality = 0.82): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('No canvas context');
  }
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = canvas.toDataURL('image/webp', quality);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality);
}
