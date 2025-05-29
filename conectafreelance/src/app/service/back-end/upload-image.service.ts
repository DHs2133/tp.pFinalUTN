import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UploadImageService {

  private http = inject(HttpClient);

  subirImagen(file: File): Observable<{ urlFoto: string }> {
    const formData = new FormData();
    formData.append('foto', file);

    return this.http.post<{ urlFoto: string }>('http://localhost:3000/uploads/single', formData);
  }
}
