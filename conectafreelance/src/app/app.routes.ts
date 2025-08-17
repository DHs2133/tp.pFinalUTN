import { Routes } from '@angular/router';
import { HomePageComponent } from './page/home-page/home-page.component';
import { RegistroProfesionalComponent } from './page/registro-profesional/registro-profesional.component';
import { RegistroContratadorComponent } from './page/registro-contratador/registro-contratador.component';
import { LoginPageComponent } from './page/login-page/login-page.component';
import { PerfilAdminPageComponent } from './page/perfil/perfil-admin-page/perfil-admin-page.component';
import { PerfilContratadorPageComponent } from './page/perfil/perfil-contratador-page/perfil-contratador-page.component';
import { PerfilProfesionalPageComponent } from './page/perfil/perfil-profesional-page/perfil-profesional-page.component';
import { ModifyProfesionalComponent } from './componentes/usuario/usuarioProfesional/crud-profesional/modify-profesional/modify-profesional.component';
import { ModifyPublicacionPageComponent } from './page/modify-publicacion-page/modify-publicacion-page.component';
import { ProfesionalProfesionalPerfilComponent } from './componentes/usuario/usuarioProfesional/crud-profesional/profesional-profesional-perfil/profesional-profesional-perfil.component';
import { ContratadorProfesionalPerfilComponent } from './componentes/usuario/usuarioProfesional/crud-profesional/contratador-profesional-perfil/contratador-profesional-perfil.component';
import { AdminProfesionalPerfilComponent } from './componentes/usuario/usuarioProfesional/crud-profesional/admin-profesional-perfil/admin-profesional-perfil.component';
import { ListProfesionalComponent } from './componentes/usuario/usuarioProfesional/crud-profesional/list-profesional/list-profesional.component';
import { ModifyContratadorComponent } from './componentes/usuario/usuarioContratador/crud-contratador/modify-contratador/modify-contratador.component';
import { ModifyComentarioComponent } from './componentes/comentario/modify-comentario/modify-comentario.component';

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


},{
  path: "modPerCont/:id",
  component: ModifyContratadorComponent


},
{
  path: "modPublicacion/:id",
  component: ModifyPublicacionPageComponent

},
{
  path: "listaProfesionales",
  component: ListProfesionalComponent
},
{

  path: "modifyComentario/:id",
  component: ModifyComentarioComponent


},
{
  path: "profprofperfil/:id",
  component: ProfesionalProfesionalPerfilComponent
},
{
  path: "contprofperfil/:id",
  component: ContratadorProfesionalPerfilComponent
},
{
  path: "admprofperfil/:id",
  component: AdminProfesionalPerfilComponent
}
];
