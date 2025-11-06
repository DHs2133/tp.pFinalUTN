import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  estoyLogueado: boolean = false;

  logIn(){
    this.estoyLogueado = true;
  }

  logOut(){
    this.estoyLogueado = false;
  }


  set(id: string | undefined, rol: string | undefined) {
    if(id && rol){
      localStorage.setItem('id', id);
      localStorage.setItem('rol', rol);
      this.logIn();
    }

  }

  getId(): string {
    return localStorage.getItem('id')!;
  }

  getRol(): string {

    return localStorage.getItem('rol')!;

  }

  clear() {
    localStorage.removeItem('id');
    localStorage.removeItem('rol');
    this.logOut();
  }
}
