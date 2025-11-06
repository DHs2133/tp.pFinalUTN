export interface Notificacion{
  descripcion: string,
  idEnt?: string,
  leido: boolean
}

export interface ListaNotificaciones{
  id?: string,
  idDuenio: string,
  notificaciones: Notificacion[]
}


