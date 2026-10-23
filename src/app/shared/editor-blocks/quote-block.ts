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
  selector: 'quote-block',
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
      <blockquote
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
      ></blockquote>
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
    blockquote {
      position: relative;
      margin: 0.75rem 0;
      padding: 0.5rem 1rem 0.5rem 2.5rem;
      border-left: 4px solid var(--brand-dorado);
      border-radius: 0 12px 12px 0;
      background: var(--brand-vainilla);
      color: var(--brand-espresso);
      font-style: italic;
      font-size: var(--mat-sys-body-large);
      line-height: 1.6;
    }
    blockquote::before {
      content: '\\201C';
      position: absolute;
      top: -0.4rem;
      left: 0.3rem;
      font-size: 3rem;
      line-height: 1;
      color: var(--brand-ochre);
      opacity: 0.55;
    }
    blockquote.featured {
      border-left-width: 7px;
      border-color: var(--brand-ember);
      background: linear-gradient(
        90deg,
        rgba(201, 162, 39, 0.18),
        var(--brand-hueso) 55%
      );
    }
  `,
})
export class QuoteBlockComponent {
  sortIndex = input(0);
  componentInstanceName = 'QuoteBlockComponent';
  autofocus = input(true);
  formGroup = input.required<FormGroup>();
  formControlName = input.required<string>();
  blockOptionActions = input<BlockOptionAction[]>([
    { action: 'quote', text: 'Cita' },
    { action: 'featured', text: 'Destacada' },
  ]);
  savedAction = signal('quote');
  actionCallbackBind = this.actionCallback.bind(this);

  actionCallback(action: string, updateFormValue = true): void {
    this.savedAction.set(action);
    updateFormValue && this.formGroup().updateValueAndValidity();
  }
}