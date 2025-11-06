import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { EntElimPorAdm } from '../interfaceEntElimPorAdmin/int-ent-elim-por-adm';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServEntElimPorAdmService {

  constructor(private http: HttpClient) { }

  urlentElimPorAdm: string = 'http://localhost:3001/entElimPorAdm'

  postEntElimPorAdm(entElimPorAdm: EntElimPorAdm): Observable<EntElimPorAdm>{

    return this.http.post<EntElimPorAdm>(this.urlentElimPorAdm, entElimPorAdm);
  }

  getPublicacionesPorIDDuenio(idDuenio: string): Observable<EntElimPorAdm[]> {

    return this.http.get<EntElimPorAdm[]>(`${this.urlentElimPorAdm}?idDuenio=${idDuenio}`);
  }

  putPublicacion(entElimPorAdm: EntElimPorAdm, id: string | null): Observable<EntElimPorAdm>{

    return this.http.put<EntElimPorAdm>(`${this.urlentElimPorAdm}/${id}`, entElimPorAdm);
  }
}
