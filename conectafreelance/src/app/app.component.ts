import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AccessDeniedPageComponentComponent } from "./componentes/page-components/access-denied-page-component/access-denied-page-component.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AccessDeniedPageComponentComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'conectafreelance';
}
