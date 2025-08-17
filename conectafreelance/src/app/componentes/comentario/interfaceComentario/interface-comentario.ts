export interface Comentario {
  id?: string,
  idCreador: string,
  idDestinatario: string,
  contenido: string,
  estado: 'activa' | 'inactiva',
  reportada: boolean,
  puntaje: number
}
