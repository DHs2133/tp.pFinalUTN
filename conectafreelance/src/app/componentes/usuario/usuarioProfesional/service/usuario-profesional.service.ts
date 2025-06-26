import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UsuarioProfesional } from '../../interfaceUsuario/usuario.interface';

@Injectable({
  providedIn: 'root'
})
export class UsuarioProfesionalService {

  constructor(private http: HttpClient) { }

  urlUsuarioProfesional: string = 'http://localhost:3001/usuariosProfesionales'

  getUsuariosProfesionales(): Observable<UsuarioProfesional[]>{

    return this.http.get<UsuarioProfesional[]>(this.urlUsuarioProfesional)
  }

  getUsuariosProfesionalPorEmail(email: string): Observable<UsuarioProfesional[]>{

    return this.http.get<UsuarioProfesional[]>(`${this.urlUsuarioProfesional}?email=${email}`)
  }

  getUsuariosProfesionalPorID(id: string | null): Observable<UsuarioProfesional>{

    return this.http.get<UsuarioProfesional>(`${this.urlUsuarioProfesional}/${id}`)
  }


  postUsuariosProfesionales(nvoUsuarioProfesional: UsuarioProfesional): Observable<UsuarioProfesional>{

    return this.http.post<UsuarioProfesional>(this.urlUsuarioProfesional, nvoUsuarioProfesional)
  }

  putUsuariosProfesionales(modUsuarioProfesional: UsuarioProfesional, id: string | null): Observable<UsuarioProfesional>{

    return this.http.put<UsuarioProfesional>(`${this.urlUsuarioProfesional}/${id}`, modUsuarioProfesional)
  }

  deleteUsuarioProfesionalByEmail(email: string): Observable<void>{

    return this.http.delete<void>(`${this.urlUsuarioProfesional}/${email}`)

  }



}
