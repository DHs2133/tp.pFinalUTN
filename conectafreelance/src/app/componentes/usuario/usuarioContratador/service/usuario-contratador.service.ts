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

  getUsuariosContratadoresPorId(id: string):Observable<UsuarioContratador>{

    return this.http.get<UsuarioContratador>(`${this.urlUsuarioContratador}/${id}`)
  }


  postUsuariosContratadores(nvoUsuarioContratador: UsuarioContratador): Observable<UsuarioContratador>{

    return this.http.post<UsuarioContratador>(this.urlUsuarioContratador, nvoUsuarioContratador)
  }

  putUsuariosContratadores(modUsuarioContratador: UsuarioContratador, id: string | null): Observable<UsuarioContratador>{

    return this.http.put<UsuarioContratador>(`${this.urlUsuarioContratador}/${id}`, modUsuarioContratador)
  }

  deleteUsuarioContratadorByID(id: string): Observable<void>{

    return this.http.delete<void>(`${this.urlUsuarioContratador}/${id}`)

  }

}
