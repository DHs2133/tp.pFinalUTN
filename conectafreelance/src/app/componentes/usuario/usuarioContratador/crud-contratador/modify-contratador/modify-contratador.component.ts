import { Component, inject } from '@angular/core';
import { UsuarioProfesionalService } from '../../../usuarioProfesional/service/usuario-profesional.service';

@Component({
  selector: 'app-modify-contratador',
  imports: [],
  templateUrl: './modify-contratador.component.html',
  styleUrl: './modify-contratador.component.css'
})
export class ModifyContratadorComponent {

  profService = inject(UsuarioProfesionalService);

}
