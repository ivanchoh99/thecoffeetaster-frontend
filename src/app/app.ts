import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SessionCoordinator } from './core/services/session-coordinator.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  private readonly sessionCoordinator = inject(SessionCoordinator);

  protected readonly title = signal('thecoffetaster-frontend');

  ngOnInit(): void {
    this.sessionCoordinator.init();
  }
}
