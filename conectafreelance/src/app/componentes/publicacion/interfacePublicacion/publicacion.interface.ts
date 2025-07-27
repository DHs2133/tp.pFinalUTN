export interface Publicacion {
  id?: string,
  idCreador: string,
  nombreCreador: string,
  fotoCreador: string,
  urlFoto?: string,
  cont: string,
  estado: 'activa' | 'inactiva',
  reportada: true|false
}

