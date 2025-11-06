import { Component, inject } from '@angular/core';
import { LoginService } from '../../../utils/service/login-service.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-access-denied-hrl-page-component',
  imports: [],
  templateUrl: './access-denied-hrl-page-component.component.html',
  styleUrl: './access-denied-hrl-page-component.component.css'
})
export class AccessDeniedHrlPageComponentComponent {

  loginService = inject(LoginService);
  router = inject(Router);


  redireccion(){

    const id = this.loginService.getId();
    const rol = this.loginService.getRol();

    console.log('redireccion - id:', id, 'rol:', rol);

    const roleRoutes: { [key: string]: string } = {
      profesional: '/profesional/perfil',
      contratador: '/contratador/perfil',
      admin: '/admin/perfil'
    };

    if (id && rol && ['profesional', 'contratador', 'admin'].includes(rol)) {
      const ruta = roleRoutes[rol];
      console.log('redireccion - Navegando a:', ruta);
      this.router.navigateByUrl(ruta);
    } else {
      console.error('redireccion - ID o rol inválidos:', { id, rol });
      this.loginService.clear();
      this.router.navigateByUrl('/home');
    }
  }



}
