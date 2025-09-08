export interface Mensaje{
  id?: string,
  idCreador: string,
  contenido: string,
  leido: boolean,
  visualizado: boolean,  //Esto sirve para que el ícono de mensaje cambie
}
