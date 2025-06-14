import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoginService {
  setEmail(email: string) {
    localStorage.setItem('email', email);
  }

  getEmail(): string {
    return localStorage.getItem('email')!;
  }

  clearEmail() {
    localStorage.removeItem('email');
  }
}
