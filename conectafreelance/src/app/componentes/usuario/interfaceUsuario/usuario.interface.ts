export interface Usuario{
  id?: string,
  nombreCompleto: string,
  email: string,
  contrasenia: string,
  urlFoto: string,
  activo: boolean,
  rol: "contratador"|"profesional"|"administrador"

}

export interface UsuarioProfesional extends Usuario{

  profesion: string,
  descripcion: string,
  ciudad: string,
  provincia: string,
  pais: string,
  promedio: number,
  cantComentarios: number

}

export interface UsuarioContratador extends Usuario{

  empresaRepresentada?: String

}

export interface UsuarioAdministrador extends Usuario{

  permisos: ('eliminarPublicaciones' | 'eliminarComentarios' | 'darDeBajaUsuarios')[];

}
