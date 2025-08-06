import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  set(id: string | undefined, rol: string | undefined) {
    if(id)
    localStorage.setItem('id', id);
    if(rol)
    localStorage.setItem('rol', rol);

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
  }
}
