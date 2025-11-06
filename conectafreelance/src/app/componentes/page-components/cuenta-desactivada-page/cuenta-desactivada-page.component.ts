import { Component, inject, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { LoginService } from '../../../utils/service/login-service.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-cuenta-desactivada-page',
  imports: [],
  templateUrl: './cuenta-desactivada-page.component.html',
  styleUrl: './cuenta-desactivada-page.component.css'
})
export class CuentaDesactivadaPageComponent{

  router = inject(Router);
  loginService = inject(LoginService);
  destroy$ = new Subject<void>();


  redireccion(){
    this.loginService.clear();
    this.router.navigate([''])
  }

}
