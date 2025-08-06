import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileSelectService {

  // FileFileSelectService lo que permite es la vinculación de la foto que se suba a la cuenta.
  // Aparte utiliza Blob URL (Binary Large Object, representa datos binarios como archivos de imagen sin
  // procesar) para previsualizar, en este caso, fotos.

  private archivoSeleccionado?: File;
  private imagePreviewUrl?: string; // string que va a almacenar la URL para previsualización

  // Guarda el archivo y genera la URL para previsualización
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.archivoSeleccionado = file;
      if (this.imagePreviewUrl) {

        /// Cuando el usuario vea la imágen, va a ser con la que creó la cuenta
        /// Al modificarla, se borra la vieja y se establece la nueva.
        URL.revokeObjectURL(this.imagePreviewUrl);
      }
      this.imagePreviewUrl = URL.createObjectURL(file);
    }
  }

  // Se el archivo subido por el usuario
  getArchivoSeleccionado(): File | undefined{
    if(this.archivoSeleccionado){
    return this.archivoSeleccionado;
    }
    return undefined;


  }

  // Obtiene la URL de previsualización
  getImagePreviewUrl(): string | undefined{
    if(this.imagePreviewUrl){
      return this.imagePreviewUrl;
    }
    return undefined;

  }

  clearSelection(): void {
  this.archivoSeleccionado = undefined;
  if (this.imagePreviewUrl) {
    URL.revokeObjectURL(this.imagePreviewUrl);
    this.imagePreviewUrl = undefined;
  }
}

}
