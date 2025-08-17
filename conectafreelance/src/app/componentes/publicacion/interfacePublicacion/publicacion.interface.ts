export interface Publicacion {
  id?: string,
  idCreador: string,
  urlFoto?: string,
  cont: string,
  estado: 'activa' | 'inactiva',
  reportada: true|false
}

