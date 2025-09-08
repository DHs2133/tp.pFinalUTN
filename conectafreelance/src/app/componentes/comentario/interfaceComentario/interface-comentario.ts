export interface Comentario {
  id?: string,
  idCreador: string,
  idDestinatario: string,
  contenido: string,
  reportada: boolean,
  controlado: boolean,
  puntaje: number
}
