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
import { ModifyComentarioContPerfilComponent } from './componentes/comentario/modify-comentario-cont-perfil/modify-comentario-cont-perfil.component';
import { ModifyAdminComponent } from './componentes/usuario/usuarioAdmin/crud-admin/modify-admin/modify-admin.component';
import { ListChatPageParaContratadorComponent } from './page/list-chat-contratador-page/list-chat-page-para-contratador.component';
import { MainLayoutContratadorComponent } from './layouts/main-layout-contratador/main-layout-contratador.component';
import { MainLayoutProfesionalComponent } from './layouts/main-layout-profesional/main-layout-profesional.component';
import { MainLayoutAdministradorComponent } from './layouts/main-layout-administrador/main-layout-administrador.component';
import { ListMensajeComponent } from './componentes/mensaje/list-mensaje/list-mensaje.component';
import { ListChatProfesionalPageComponent } from './page/list-chat-profesional-page/list-chat-profesional-page.component';
import { authGuardFn } from './utils/service/auth-guard-fn';
import { AccessDeniedPageComponentComponent } from './componentes/page-components/access-denied-page-component/access-denied-page-component.component';
import { authGuardFnLogOut } from './utils/service/auth-guard-fn-logout';
import { authGuardFnHrl } from './utils/service/auth-guard-fn-hrl';
import { AccessDeniedHrlPageComponentComponent } from './componentes/page-components/access-denied-hrl-page-component/access-denied-hrl-page-component.component';
import { authGuardFnHrlAccessDenied } from './utils/service/auth-guard-fn-hrl-accessdenied copy';
import { CuentaDesactivadaPageComponent } from './componentes/page-components/cuenta-desactivada-page/cuenta-desactivada-page.component';
import { ListContratadorComponent } from './componentes/usuario/usuarioContratador/crud-contratador/list-contratador/list-contratador.component';
import { AdminContratadorPerfilComponent } from './componentes/usuario/usuarioContratador/crud-contratador/admin-contratador-perfil/admin-contratador-perfil.component';




export const routes: Routes = [{

  path: 'contratador',
  component: MainLayoutContratadorComponent,
  canActivate: [authGuardFn],
  children: [
    { path: "perfil", component: PerfilContratadorPageComponent},
    { path: "perfil/modComentPerfilCont/:id", component: ModifyComentarioContPerfilComponent},
    { path: "contprofperfil/:id/modifyComentario/:idComentario", component: ModifyComentarioComponent},
    { path: "listaProfesionales", component: ListProfesionalComponent},
    { path: "contprofperfil/:id", component: ContratadorProfesionalPerfilComponent},
    { path: "listaChatsContratador", component: ListChatPageParaContratadorComponent},
    { path: "listaChatsContratador/:idProf", component: ListChatPageParaContratadorComponent},
    { path: "modPerCont/:id", component: ModifyContratadorComponent},
  ],


},
  {
    path: 'profesional',
    component: MainLayoutProfesionalComponent,
    canActivate: [authGuardFn],
    children: [
      { path: "perfil", component: PerfilProfesionalPageComponent },
      { path: "modPerProf/:id", component: ModifyProfesionalComponent},
      { path: "perfil/modPublicacion/:id", component: ModifyPublicacionPageComponent},
      { path: "listaProfesionales", component: ListProfesionalComponent },
      { path: "profprofperfil/:id", component: ProfesionalProfesionalPerfilComponent},
      { path: "listaChatsProfesional", component: ListChatProfesionalPageComponent},
      { path: "listaChatsProfesional:idCont", component: ListChatProfesionalPageComponent}

    ]
  },
  {
    path: 'admin',
    component: MainLayoutAdministradorComponent,
    canActivate: [authGuardFn],
    children: [
      { path: 'perfil', component: PerfilAdminPageComponent },
      { path: 'modPerAdm/:id', component: ModifyAdminComponent },
      { path: "admprofperfil/:id", component: AdminProfesionalPerfilComponent },
      { path: "listaProfesionales", component: ListProfesionalComponent },
      { path: "listaContratadores", component: ListContratadorComponent},
      { path: "perfAdmCont/:id", component: AdminContratadorPerfilComponent}
    ]
  },
  {
    path: 'home',
    canActivate: [authGuardFnHrl],
    component: HomePageComponent
  },
  {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
  },
  {
    path: 'registroProfesional',
    canActivate: [authGuardFnHrl],
    component: RegistroProfesionalComponent
  },
  {
    path: 'registroContratador',
    canActivate: [authGuardFnHrl],
    component: RegistroContratadorComponent
  },
  {
    path: 'login',
    canActivate: [authGuardFnHrl],
    ///este redirige a la pagina de acceso denegado de hrl si se está logueado
    component: LoginPageComponent
  },
  {
    path: 'access-denied',
    canActivate: [authGuardFnLogOut],
    component: AccessDeniedPageComponentComponent

  },
  {
    path: 'access-denied-hrl',
    canActivate: [authGuardFnHrlAccessDenied],
    component: AccessDeniedHrlPageComponentComponent
  },
  {
    path: 'cuenta-desactivada',
    component: CuentaDesactivadaPageComponent
  },
  {
    path: '**',
    redirectTo: 'home'
  },
]
