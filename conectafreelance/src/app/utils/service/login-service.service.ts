import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class LoginService {
  private emailSubject = new BehaviorSubject<string | null>(null);
  email$: Observable<string | null> = this.emailSubject.asObservable();

  setEmail(email: string) {
    this.emailSubject.next(email);
    localStorage.setItem('email', email);
  }

  getEmail(): string | null {
    return this.emailSubject.value || localStorage.getItem('email');
  }

  clearEmail() {
    this.emailSubject.next(null);
    localStorage.removeItem('email');
  }
}
