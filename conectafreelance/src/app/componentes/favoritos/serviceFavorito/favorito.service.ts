import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { Favorito } from '../interfaceFavoritos/favorito.interface';

@Injectable({
  providedIn: 'root'
})
export class FavoritoService {

  constructor(private http: HttpClient) { }

  urlFavorito: string = 'http://localhost:3001/favoritos';

  getFavoritoPorIDCreador(idDuenio: string | null): Observable<Favorito[]>{

    return this.http.get<Favorito[]>(`${this.urlFavorito}?idDuenio=${idDuenio}`)
  }

  postFavorito(nvoFavorito: Favorito): Observable<Favorito>{

    return this.http.post<Favorito>(this.urlFavorito, nvoFavorito)
  }

  putFavorito(favoritoMofidicado: Favorito, id: string | null): Observable<Favorito>{

    return this.http.put<Favorito>(`${this.urlFavorito}/${id}`, favoritoMofidicado)
  }

  deleteFavoritolById(id: string): Observable<void>{

    return this.http.delete<void>(`${this.urlFavorito}/${id}`)

  }



}
