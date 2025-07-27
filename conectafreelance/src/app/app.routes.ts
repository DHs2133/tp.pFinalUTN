import { Routes } from '@angular/router';
import { HomePageComponent } from './page/home-page/home-page.component';
import { RegistroProfesionalComponent } from './page/registro-profesional/registro-profesional.component';
import { RegistroContratadorComponent } from './page/registro-contratador/registro-contratador.component';
import { LoginPageComponent } from './page/login-page/login-page.component';
import { PerfilAdminPageComponent } from './page/perfil/perfil-admin-page/perfil-admin-page.component';
import { PerfilContratadorPageComponent } from './page/perfil/perfil-contratador-page/perfil-contratador-page.component';
import { PerfilProfesionalPageComponent } from './page/perfil/perfil-profesional-page/perfil-profesional-page.component';
import { ModifyProfesionalComponent } from './componentes/usuario/usuarioProfesional/crud-profesional/modify-profesional/modify-profesional.component';
import { ModifyPublicacionComponent } from './componentes/publicacion/modify-publicacion/modify-publicacion.component';
import { ModifyPublicacionPageComponent } from './page/modify-publicacion-page/modify-publicacion-page.component';

export const routes: Routes = [{

  path: 'home',
  component: HomePageComponent
},
{
  path: '',
  component: HomePageComponent

},
{
  path: 'registroProfesional',
  component: RegistroProfesionalComponent
},
{

  path: 'registroContratador',
  component: RegistroContratadorComponent

},
{

  path:'login',
  component: LoginPageComponent
},
{

  path: "perfilAdmin",
  component: PerfilAdminPageComponent

},
{
  path: "perfilContratador",
  component: PerfilContratadorPageComponent
},
{

  path: "perfilProfesional",
  component: PerfilProfesionalPageComponent

},
{
  path: "modPerProf/:id",
  component: ModifyProfesionalComponent


},
{
  path: "modPublicacion/:id",
  component: ModifyPublicacionPageComponent

}
];
