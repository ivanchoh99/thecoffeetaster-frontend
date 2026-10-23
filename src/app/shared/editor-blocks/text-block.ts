import { NgClass } from '@angular/common';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { Component, input, signal } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AutofocusDirective,
  CleanPasteDataDirective,
  ControlAccessorDirective,
  ToolbarFabDirective,
  type BlockOptionAction,
} from '@tmdjr/ngx-editor-js2';

@Component({
  selector: 'text-block',
  host: { class: 'cdk-drag-animating' },
  hostDirectives: [CdkDrag],
  imports: [
    ReactiveFormsModule,
    NgClass,
    ControlAccessorDirective,
    AutofocusDirective,
    ToolbarFabDirective,
    CleanPasteDataDirective,
  ],
  template: `
    <ng-container [formGroup]="formGroup()">
      <p
        controlAccessor
        contentEditable
        cleanPasteData
        toolbarFab
        [ngClass]="savedAction()"
        [defaultValue]="formGroup().get(formControlName())?.value"
        [actionCallback]="actionCallbackBind"
        [autofocus]="autofocus()"
        [blockOptionActions]="blockOptionActions()"
        [formControlName]="formControlName()"
        [componentContextPositionIndex]="sortIndex()"
      ></p>
    </ng-container>
  `,
  styles: `
    :host {
      display: block;
      position: relative;
    }
    :host:focus-within {
      outline: 2px solid var(--brand-dorado);
      outline-offset: 3px;
      border-radius: 10px;
    }
    p {
      margin: 0.4rem 0;
      line-height: 1.7;
    }
    :host .small {
      font: var(--mat-sys-body-small);
    }
    :host .medium {
      font: var(--mat-sys-body-medium);
    }
    :host .large {
      font: var(--mat-sys-body-large);
    }
    :host .title-small {
      font: var(--mat-sys-title-small);
    }
    :host .title-medium {
      font: var(--mat-sys-title-medium);
    }
    :host .title-large {
      font: var(--mat-sys-title-large);
    }
  `,
})
export class TextBlockComponent {
  sortIndex = input(0);
  componentInstanceName = 'TextBlockComponent';
  autofocus = input(true);
  formGroup = input.required<FormGroup>();
  formControlName = input.required<string>();
  blockOptionActions = input<BlockOptionAction[]>([
    { action: 'small', text: 'Pequeño' },
    { action: 'medium', text: 'Normal' },
    { action: 'large', text: 'Grande' },
    { action: 'title-small', text: 'Subtítulo' },
    { action: 'title-medium', text: 'Título' },
    { action: 'title-large', text: 'Titular' },
  ]);
  savedAction = signal('medium');
  actionCallbackBind = this.actionCallback.bind(this);

  actionCallback(action: string, updateFormValue = true): void {
    this.savedAction.set(action);
    updateFormValue && this.formGroup().updateValueAndValidity();
  }
}