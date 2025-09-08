import { NavbarAdministradorComponentComponent } from '../../componentes/page-components/navbar-administrador-component/navbar-administrador-component.component';
import { NavbarContratadorComponentComponent } from '../../componentes/page-components/navbar-contratador-component/navbar-contratador-component.component';
import { NavbarProfesionalComponentComponent } from '../../componentes/page-components/navbar-profesional-component/navbar-profesional-component.component';
import { LoginService } from './../../utils/service/login-service.service';
import { Component, inject, OnInit } from '@angular/core';

@Component({
  selector: 'app-navbar-usuarios',
  imports: [NavbarProfesionalComponentComponent,
    NavbarContratadorComponentComponent,
    NavbarAdministradorComponentComponent
  ],
  templateUrl: './navbar-usuarios.component.html',
  styleUrl: './navbar-usuarios.component.css'
})
export class NavbarUsuariosComponent implements OnInit{

  serviceLogin = inject(LoginService);
  rol: string = "";

  ngOnInit(): void {
    this.rol = this.serviceLogin.getRol();

  }

}
