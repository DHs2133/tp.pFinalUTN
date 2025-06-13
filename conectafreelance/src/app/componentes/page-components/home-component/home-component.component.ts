import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home-component',
  imports: [],
  templateUrl: './home-component.component.html',
  styleUrl: './home-component.component.css'
})
export class HomeComponentComponent {

  router = inject(Router);

  redirigirLogin(){
    this.router.navigate(["./login"])
  }

  redirigirRegistroProfesional(){

    this.router.navigate(["./registroProfesional"])
  }
  redirigirRegistroContratador(){
    this.router.navigate(["./registroContratador"])
  }

}
