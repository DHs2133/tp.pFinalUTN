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

  empresaRepresentada?: string

}

export interface UsuarioAdministrador extends Usuario{

  permisos: 1|2|3
  // Lo voy a hacer con números porque es más fácil de manejar y van a ir del 1 al 3. 1 es la menor
  // responsabilidad (solo comentarios), 2 es una responsabilidad mayor (publicación y comentarios) y
  // 3 es la mayor responsabilidad (publicación, comentarios y cuentas).

}
