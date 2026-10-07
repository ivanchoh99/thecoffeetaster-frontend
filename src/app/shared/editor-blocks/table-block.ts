import { CdkDrag } from '@angular/cdk/drag-drop';
import { Component, ElementRef, input, signal, viewChild } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  AutofocusDirective,
  CleanPasteDataDirective,
  ControlAccessorDirective,
  ToolbarFabDirective,
  type BlockOptionAction,
} from '@tmdjr/ngx-editor-js2';

@Component({
  selector: 'table-block',
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
      <div class="table-wrap">
        <table
          #tableRef
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
        >
          <tbody>
            <tr>
              <td>&nbsp;</td>
            </tr>
          </tbody>
        </table>
      </div>
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
    .table-wrap {
      margin: 0.75rem 0;
      overflow-x: auto;
      border: 1px solid var(--brand-arena);
      border-radius: 12px;
      background: var(--brand-hueso);
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: var(--mat-sys-body-medium);
    }
    th,
    td {
      min-width: 6rem;
      padding: 0.5rem 0.75rem;
      border: 1px solid var(--brand-arena);
      text-align: left;
      vertical-align: top;
    }
    td:focus,
    th:focus {
      outline: 2px solid var(--brand-dorado);
      outline-offset: -2px;
    }
    tr:first-child td {
      background: var(--brand-vainilla);
      font-weight: 600;
      color: var(--brand-espresso);
    }
  `,
})
export class TableBlockComponent {
  sortIndex = input(0);
  componentInstanceName = 'TableBlockComponent';
  autofocus = input(true);
  formGroup = input.required<FormGroup>();
  formControlName = input.required<string>();
  blockOptionActions = input<BlockOptionAction[]>([
    { action: 'addRow', text: 'Fila +' },
    { action: 'addColumn', text: 'Col +' },
    { action: 'removeRow', text: 'Fila −' },
    { action: 'removeColumn', text: 'Col −' },
  ]);
  savedAction = signal('table');
  tableEl = viewChild.required<ElementRef<HTMLTableElement>>('tableRef');
  actionCallbackBind = this.actionCallback.bind(this);

  actionCallback(action: string, updateFormValue = true): void {
    switch (action) {
      case 'addRow':
      case 'addColumn':
      case 'removeRow':
      case 'removeColumn':
        this.mutateTable(action, updateFormValue);
        break;
      default:
        this.savedAction.set(action);
        updateFormValue && this.formGroup().updateValueAndValidity();
    }
  }

  private mutateTable(action: string, updateFormValue: boolean): void {
    const table = this.tableEl()?.nativeElement;
    const tbody = table?.tBodies[0];
    if (!table || !tbody) {
      return;
    }
    switch (action) {
      case 'addRow':
        this.addRow(tbody);
        break;
      case 'addColumn':
        this.addColumn(tbody);
        break;
      case 'removeRow':
        this.removeRow(tbody);
        break;
      case 'removeColumn':
        this.removeColumn(tbody);
        break;
    }
    if (updateFormValue) {
      table.dispatchEvent(new Event('input', { bubbles: true }));
      this.formGroup().updateValueAndValidity();
    }
  }

  private addRow(tbody: HTMLTableSectionElement): void {
    const cols = Math.max(1, tbody.rows[0]?.cells.length ?? 1);
    const tr = document.createElement('tr');
    for (let i = 0; i < cols; i++) {
      const td = document.createElement('td');
      td.innerHTML = '&nbsp;';
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }

  private addColumn(tbody: HTMLTableSectionElement): void {
    for (const row of Array.from(tbody.rows)) {
      const td = document.createElement('td');
      td.innerHTML = '&nbsp;';
      row.appendChild(td);
    }
  }

  private removeRow(tbody: HTMLTableSectionElement): void {
    if (tbody.rows.length > 1) {
      tbody.deleteRow(tbody.rows.length - 1);
    }
  }

  private removeColumn(tbody: HTMLTableSectionElement): void {
    const firstRow = tbody.rows[0];
    if (firstRow && firstRow.cells.length > 1) {
      for (let i = tbody.rows.length - 1; i >= 0; i--) {
        tbody.rows[i].deleteCell(tbody.rows[i].cells.length - 1);
      }
    }
  }
}