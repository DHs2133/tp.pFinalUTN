import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UsuarioAdministrador } from '../../interfaceUsuario/usuario.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UsuarioAdministradorService {

  constructor(private http: HttpClient) { }

  urlUsuarioAdministrador: string = 'http://localhost:3001/usuariosAdministradores'

  getUsuariosAdministradores(): Observable<UsuarioAdministrador[]>{

    return this.http.get<UsuarioAdministrador[]>(this.urlUsuarioAdministrador)
  }


  getUsuariosAdministradoresPorEmail(email: string): Observable<UsuarioAdministrador[]>{

    return this.http.get<UsuarioAdministrador[]>(`${this.urlUsuarioAdministrador}?email=${email}`)
  }

  getUsuariosAdministradoresPorID(id: string): Observable<UsuarioAdministrador>{

    return this.http.get<UsuarioAdministrador>(`${this.urlUsuarioAdministrador}/${id}`)
  }


  postUsuariosAdministradores(nvoUsuarioAdministrador: UsuarioAdministrador): Observable<UsuarioAdministrador>{

    return this.http.post<UsuarioAdministrador>(this.urlUsuarioAdministrador, nvoUsuarioAdministrador)
  }

  putUsuariosAdministradores(modUsuarioAdministrador: UsuarioAdministrador, id: string | null): Observable<UsuarioAdministrador>{

    return this.http.put<UsuarioAdministrador>(`${this.urlUsuarioAdministrador}/${id}`, modUsuarioAdministrador)
  }

  deleteUsuarioAdministradorByEmail(email: string): Observable<void>{

    return this.http.delete<void>(`${this.urlUsuarioAdministrador}/${email}`)

  }

}
