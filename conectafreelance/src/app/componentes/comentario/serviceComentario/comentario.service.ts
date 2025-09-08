import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Comentario } from '../interfaceComentario/interface-comentario';

@Injectable({
  providedIn: 'root'
})

export class ComentarioService {

  constructor(private http: HttpClient) { }

  urlComentario: string = 'http://localhost:3001/comentarios'

  postComentario(nvoComentario: Comentario): Observable<Comentario>{

    return this.http.post<Comentario>(this.urlComentario, nvoComentario);
  }


  getComentarioPorIDcomentario(id: string): Observable<Comentario> {

    return this.http.get<Comentario>(`${this.urlComentario}/${id}`);
  }


  getComentarioPorIDcreador(idCreador: string): Observable<Comentario[]> {

    return this.http.get<Comentario[]>(`${this.urlComentario}?idCreador=${idCreador}`);
  }

  getComentarioPorIDdestinatario(idDestinatario: string | null): Observable<Comentario[]> {

    return this.http.get<Comentario[]>(`${this.urlComentario}?idDestinatario=${idDestinatario}`);
  }

  getComentarioPorIDcreadorYDestinatario(idCreador: string, idDestinatario: string | null): Observable<Comentario[]> {

    return this.http.get<Comentario[]>(`${this.urlComentario}?idCreador=${idCreador}&idDestinatario=${idDestinatario}`);
  }

  getComentariosReportados(): Observable<Comentario[]> {

    return this.http.get<Comentario[]>(`${this.urlComentario}?reportada=${true}`);
  }


  eliminarComentario(id: string): Observable<void>{

    return this.http.delete<void>(`${this.urlComentario}/${id}`);
  }

  putComentario(comentarioMod: Comentario, id: string | null): Observable<Comentario>{

    return this.http.put<Comentario>(`${this.urlComentario}/${id}`, comentarioMod);
  }

}
