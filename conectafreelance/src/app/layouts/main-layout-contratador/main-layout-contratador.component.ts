import { Component } from '@angular/core';
import { NavbarContratadorComponentComponent } from "../../componentes/page-components/navbar-contratador-component/navbar-contratador-component.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-loyout-contratador',
  imports: [RouterOutlet, NavbarContratadorComponentComponent],
  templateUrl: './main-layout-contratador.component.html',
  styleUrl: './main-layout-contratador.component.css'
})
export class MainLayoutContratadorComponent {

}
