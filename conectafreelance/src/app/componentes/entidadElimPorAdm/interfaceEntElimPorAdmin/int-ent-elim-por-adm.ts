import { Comentario } from "../../comentario/interfaceComentario/interface-comentario";
import { Publicacion } from "../../publicacion/interfacePublicacion/publicacion.interface";



export interface EntElimPorAdm {

  id?: string,
  idDuenio: string,
  tipo: string,
  motivo: string,
  entidadElim: Publicacion | Comentario

}
