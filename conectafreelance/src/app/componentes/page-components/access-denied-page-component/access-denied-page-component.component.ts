import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-access-denied-page-component',
  imports: [],
  templateUrl: './access-denied-page-component.component.html',
  styleUrl: './access-denied-page-component.component.css'
})
export class AccessDeniedPageComponentComponent {
  router = inject(Router);

  redireccion(){
    this.router.navigate([''])
  }
}
