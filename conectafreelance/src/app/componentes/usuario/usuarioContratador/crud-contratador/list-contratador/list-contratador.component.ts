import { Component } from '@angular/core';
import { UsuarioContratador } from '../../../interfaceUsuario/usuario.interface';

@Component({
  selector: 'app-list-contratador',
  imports: [],
  templateUrl: './list-contratador.component.html',
  styleUrl: './list-contratador.component.css'
})
export class ListContratadorComponent {

  listaUsuariosContratadores: UsuarioContratador[] = [];


}
