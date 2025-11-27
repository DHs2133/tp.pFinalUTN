export interface Publicacion {
  id?: string,
  idCreador: string,
  urlFoto?: string,
  cont: string,
  controlado: boolean,
  reportada: boolean,
  reportadaPor?: string
}

