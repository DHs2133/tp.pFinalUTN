export interface Usuario{
  id?: string,
  nombreCompleto: string,
  email: string,
  contrasenia: string,
  urlFoto: string,
  activo: boolean,
  rol: "contratador"|"profesional"|"admin"

}

export interface UsuarioProfesional extends Usuario{

  profesion: string,
  descripcion: string,
  ciudad: string,
  provincia: string,
  pais: string,
  promedio: number,
  cantComentarios: number,
  cantPubRep: number

}

export interface UsuarioContratador extends Usuario{

  empresaRepresentada?: string,
  cantComRep: number


}

export interface UsuarioAdministrador extends Usuario{

  permisos: 'c' | 'p' |  'cp'


}
