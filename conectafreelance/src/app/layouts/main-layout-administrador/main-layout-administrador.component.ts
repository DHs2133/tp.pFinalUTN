import { Component } from '@angular/core';
import { NavbarAdministradorComponentComponent } from "../../componentes/page-components/navbar-administrador-component/navbar-administrador-component.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-loyout-administrador',
  imports: [NavbarAdministradorComponentComponent, RouterOutlet],
  templateUrl: './main-layout-administrador.component.html',
  styleUrl: './main-layout-administrador.component.css'
})
export class MainLayoutAdministradorComponent {

}
