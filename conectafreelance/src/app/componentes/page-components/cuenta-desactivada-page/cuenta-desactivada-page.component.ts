import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../../../utils/service/login-service.service';
import { Subject } from 'rxjs';
import { PublicacionesEliminadasComponent } from '../../entidadElimPorAdm/publicaciones-eliminadas/publicaciones-eliminadas.component';
import { ComentariosEliminadosComponent } from '../../entidadElimPorAdm/comentarios-eliminados/comentarios-eliminados.component';

@Component({
  selector: 'app-cuenta-desactivada-page',
  imports: [PublicacionesEliminadasComponent, ComentariosEliminadosComponent],
  templateUrl: './cuenta-desactivada-page.component.html',
  styleUrl: './cuenta-desactivada-page.component.css'
})
export class CuentaDesactivadaPageComponent implements OnInit{

  router = inject(Router);
  loginService = inject(LoginService);
  destroy$ = new Subject<void>();
  rol: string = "";
  idSesion: string = "";

  ngOnInit(): void {
    this.rol = this.loginService.getRol();
  }

  redireccion(){
    this.loginService.clear();
    this.router.navigate([''])
  }

}
