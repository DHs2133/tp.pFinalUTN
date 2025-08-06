import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class ImageService {

  private http = inject(HttpClient);

  subirImagen(file: File): Observable<{ urlFoto: string }> {
    const formData = new FormData();
    formData.append('foto', file);

    return this.http.post<{ urlFoto: string }>('http://localhost:3000/uploads/single', formData);
  }

  actualizarImagen(file: File, oldFilename: string): Observable<{ urlFoto: string }> {
    const formData = new FormData();
    formData.append('foto', file);
    return this.http.put<{ urlFoto: string }>(`http://localhost:3000/uploads/single/${oldFilename}`, formData);
  }

  getImagen(fileName: string): Observable<Blob> {
    return this.http.get(`http://localhost:3000/uploads/single/${fileName}`, { responseType: 'blob' });
  }

  deleteImage(fileName: string): Observable<{message: string}> {

    return this.http.delete<{message: string}>(`http://localhost:3000/uploads/single/${fileName}`)
  }

}
