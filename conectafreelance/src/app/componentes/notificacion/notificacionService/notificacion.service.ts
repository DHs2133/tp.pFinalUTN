import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ListaNotificaciones } from '../interfaceNotificacion/notificacion.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class NotificacionService {


  constructor(private http: HttpClient) { }

  urlnotificacion: string = 'http://localhost:3001/listasnotificaciones'

  postListaNotificaciones(listaNotificacionNva: ListaNotificaciones): Observable<ListaNotificaciones>{

    return this.http.post<ListaNotificaciones>(this.urlnotificacion, listaNotificacionNva);
  }

  getListaNotificacionesPorIDUsuario(idDuenio: string): Observable<ListaNotificaciones[]> {

    return this.http.get<ListaNotificaciones[]>(`${this.urlnotificacion}?idDuenio=${idDuenio}`);
  }

  deleteListaNotificacioneslById(id: string): Observable<void>{

    return this.http.delete<void>(`${this.urlnotificacion}/${id}`)

  }

  putListaNotificaciones(listaNotMod: ListaNotificaciones, id: string | null): Observable<ListaNotificaciones>{

    return this.http.put<ListaNotificaciones>(`${this.urlnotificacion}/${id}`, listaNotMod);
  }




}
