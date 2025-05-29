import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class FileSelectService {

  // FileFileSelectService lo que permite es la vinculación de la foto que se suba a la cuenta.
  // Aparte utiliza Blob URL (Binary Large Object, representa datos binarios como archivos de imagen sin
  // procesar) para previsualizar, en este caso, fotos.

  private archivoSeleccionado!: File|null;
  private imagePreviewUrl!: string|null; // string que va a almacenar la URL para previsualización

  // Guarda el archivo y genera la URL para previsualización
  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      if (file) {
        this.archivoSeleccionado = file;


        // se generar la URL temporal para la previsualización
        this.imagePreviewUrl = URL.createObjectURL(file);
      }
    }
  }

  // Se el archivo subido por el usuario
  getArchivoSeleccionado(): File | null{
    return this.archivoSeleccionado;
  }

  // Obtiene la URL de previsualización
  getImagePreviewUrl(): string | null{
    return this.imagePreviewUrl;
  }

  // Método para limpiar el estado
  reset() {
    this.archivoSeleccionado = null;
    this.imagePreviewUrl = null;
  }

}
