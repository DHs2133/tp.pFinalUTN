import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UsuarioContratador } from '../../interfaceUsuario/usuario.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioContratadorService {

  constructor(private http: HttpClient) { }

  urlUsuarioContratador: string = 'http://localhost:3001/usuariosContratadores'

  getUsuariosContratadores(): Observable<UsuarioContratador[]>{

    return this.http.get<UsuarioContratador[]>(this.urlUsuarioContratador)
  }

  getUsuariosContratadoresPorEmail(correo: string):Observable<UsuarioContratador[]>{

    return this.http.get<UsuarioContratador[]>(`${this.urlUsuarioContratador}?email=${correo}`)
  }


  postUsuariosContratadores(nvoUsuarioContratador: UsuarioContratador): Observable<UsuarioContratador>{

    return this.http.post<UsuarioContratador>(this.urlUsuarioContratador, nvoUsuarioContratador)
  }

  putUsuariosContratadores(modUsuarioContratador: UsuarioContratador, mail: string): Observable<UsuarioContratador>{

    return this.http.put<UsuarioContratador>(`${this.urlUsuarioContratador}/${mail}`, modUsuarioContratador)
  }

  deleteUsuarioContratadorByEmail(email: string): Observable<void>{

    return this.http.delete<void>(`${this.urlUsuarioContratador}/${email}`)

  }

}
