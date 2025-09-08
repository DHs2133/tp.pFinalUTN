import { Mensaje } from "../../mensaje/interface-mensaje/interface-mensaje";

export interface Chat {
  id?: string,
  idParticipantes: string[],
  mensajes: Mensaje[];

}

