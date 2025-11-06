import { Comentario } from '../../comentario/interfaceComentario/interface-comentario';
import { Publicacion } from '../../publicacion/interfacePublicacion/publicacion.interface';


export interface EntElimPorAdm {
  id?: string,
  idDuenio: string,
  entidades: Entidad[]

}


export interface Entidad {

  id: string,
  motivo: string,
  comentElim?: Comentario,
  publicElim?: Publicacion

}
