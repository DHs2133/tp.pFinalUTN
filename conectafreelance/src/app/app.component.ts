import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AddProfesionalComponent } from "./componentes/usuario/usuarioProfesional/crud-profesional/add-profesional/add-profesional.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AddProfesionalComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'conectafreelance';
}
