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
  selector: 'list-block',
  host: { class: 'cdk-drag-animating' },
  hostDirectives: [CdkDrag],
  imports: [
    ReactiveFormsModule,
    ControlAccessorDirective,
    AutofocusDirective,
    ToolbarFabDirective,
    CleanPasteDataDirective,
  ],
  template: `
    <ng-container [formGroup]="formGroup()">
      @switch (savedAction()) {
        @case ('ol') {
          <ol
            controlAccessor
            contentEditable
            cleanPasteData
            toolbarFab
            [defaultValue]="formGroup().get(formControlName())?.value"
            [actionCallback]="actionCallbackBind"
            [autofocus]="autofocus()"
            [blockOptionActions]="blockOptionActions()"
            [formControlName]="formControlName()"
            [componentContextPositionIndex]="sortIndex()"
          ></ol>
        }
        @default {
          <ul
            controlAccessor
            contentEditable
            cleanPasteData
            toolbarFab
            [defaultValue]="formGroup().get(formControlName())?.value"
            [actionCallback]="actionCallbackBind"
            [autofocus]="autofocus()"
            [blockOptionActions]="blockOptionActions()"
            [formControlName]="formControlName()"
            [componentContextPositionIndex]="sortIndex()"
          ></ul>
        }
      }
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
    ul,
    ol {
      margin: 0.5rem 0;
      padding-left: 1.75rem;
      line-height: 1.7;
    }
    li {
      padding-left: 0.25rem;
    }
    ul li::marker {
      color: var(--brand-ochre);
    }
    ol li::marker {
      color: var(--brand-ochre);
      font-weight: 600;
    }
  `,
})
export class ListBlockComponent {
  sortIndex = input(0);
  componentInstanceName = 'ListBlockComponent';
  autofocus = input(true);
  formGroup = input.required<FormGroup>();
  formControlName = input.required<string>();
  blockOptionActions = input<BlockOptionAction[]>([
    { action: 'ul', icon: 'format_list_bulleted' },
    { action: 'ol', icon: 'format_list_numbered' },
  ]);
  savedAction = signal('ul');
  actionCallbackBind = this.actionCallback.bind(this);

  actionCallback(action: string, updateFormValue = true): void {
    this.savedAction.set(action);
    updateFormValue && this.formGroup().updateValueAndValidity();
  }
}