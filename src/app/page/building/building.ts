import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-building',
  templateUrl: './building.html',
  styleUrl: './building.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Building {
  readonly currentYear = new Date().getFullYear();
}
