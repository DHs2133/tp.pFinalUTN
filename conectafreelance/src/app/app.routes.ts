import { Routes } from '@angular/router';
import { HomePageComponent } from './page/home-page/home-page.component';
import { AddProfesionalComponent } from './componentes/usuario/usuarioProfesional/crud-profesional/add-profesional/add-profesional.component';
import { AddContratadorComponent } from './componentes/usuario/usuarioContratador/crud-contratador/add-contratador/add-contratador.component';

export const routes: Routes = [{

  path: '',
  component: HomePageComponent
},
{
  path: 'registroProfesional',
  component: AddProfesionalComponent
},
{

  path: 'registroContratador',
  component: AddContratadorComponent

}
];
