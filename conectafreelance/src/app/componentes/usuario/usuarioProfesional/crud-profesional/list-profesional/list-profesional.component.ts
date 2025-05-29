import { UsuarioProfesional } from './../../../interfaceUsuario/usuario.interface';
import { Component } from '@angular/core';

@Component({
  selector: 'app-list-profesional',
  imports: [],
  templateUrl: './list-profesional.component.html',
  styleUrl: './list-profesional.component.css'
})
export class ListProfesionalComponent {

  listaUsuariosProfesionales: UsuarioProfesional[] = [];




}
