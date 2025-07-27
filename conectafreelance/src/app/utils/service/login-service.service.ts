import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  setId(id: string | undefined) {
    if(id)
    localStorage.setItem('id', id);
  }

  getId(): string {
    return localStorage.getItem('id')!;
  }

  clearId() {
    localStorage.removeItem('id');
  }
}
