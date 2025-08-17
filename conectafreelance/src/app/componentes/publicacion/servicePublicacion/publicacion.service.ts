import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Publicacion } from '../interfacePublicacion/publicacion.interface';

@Injectable({
  providedIn: 'root'
})
export class PublicacionService {

  constructor(private http: HttpClient) { }

  urlpublicacion: string = 'http://localhost:3001/publicaciones'

  postPublicacion(publicacionNva: Publicacion): Observable<Publicacion>{

    return this.http.post<Publicacion>(this.urlpublicacion, publicacionNva);
  }

  getPublicacionesPorIDcreador(idCreador: string): Observable<Publicacion[]> {

    return this.http.get<Publicacion[]>(`${this.urlpublicacion}?idCreador=${idCreador}`);
  }

  getPublicacionPorIDPublicacion(idCreador: string): Observable<Publicacion>{

    return this.http.get<Publicacion>(`${this.urlpublicacion}/${idCreador}`);
  }

  eliminarPublicacion(id: string): Observable<void>{

    return this.http.delete<void>(`${this.urlpublicacion}/${id}`);
  }

  putPublicacion(publicacionMod: Publicacion, id: string | null): Observable<Publicacion>{

    return this.http.put<Publicacion>(`${this.urlpublicacion}/${id}`, publicacionMod);
  }

}
