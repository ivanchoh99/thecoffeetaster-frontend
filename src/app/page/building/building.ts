import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-building',
  templateUrl: './building.html',
  styleUrl: './building.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Building {
  readonly currentYear = new Date().getFullYear();
}
