import { Component } from '@angular/core';
import { NavbarProfesionalComponentComponent } from "../../componentes/page-components/navbar-profesional-component/navbar-profesional-component.component";
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-loyout-profesional',
  imports: [NavbarProfesionalComponentComponent, RouterOutlet],
  templateUrl: './main-layout-profesional.component.html',
  styleUrl: './main-layout-profesional.component.css'
})
export class MainLayoutProfesionalComponent {

}
