export interface Comentario {
  id?: string,
  idCreador: string,
  idDestinatario: string,
  nombreCreador: string,
  fotoCreador: string,
  contenido: string,
  activo: boolean,
  reportado: boolean,
  puntaje: number
}
