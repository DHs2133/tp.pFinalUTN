import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

export class PromedioService {

  private puntajes: number [] = [];

  agregarPuntaje(nvoPuntaje: number){
    this.puntajes.push(nvoPuntaje);
  }

  agregarPuntajes(numeros: number[]){
    if(numeros.length > 0){
      this.puntajes = [...numeros];
    }
  }

  eliminarUnElemento(valor: number): void {
    const index = this.puntajes.findIndex(num => num === valor);
    if (index !== -1) {
      this.puntajes.splice(index, 1);
    }
  }



  getPromedio(){
    return this.puntajes.length > 0
            // Si es mayor a 0
      ? this.puntajes.reduce((sum, puntaje) => sum + puntaje, 0) / this.puntajes.length
            // se suman todos los elementos y se dividen por la cantidad de elementos que hay dentro del array.
      : 0;
      // En caso contrario, por defecto se devuelve 0.
  }

  getCantidadElementos(){

    return this.puntajes.length;
  }

  deletePuntaje(){

    this.puntajes = [];
  }


}
