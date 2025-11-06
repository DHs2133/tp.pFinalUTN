import { inject } from "@angular/core";
import { Router } from "@angular/router";

export const authGuardFnLogOut = () =>{

  const router = inject(Router);
  if(localStorage.getItem('id')){
    const id = localStorage.getItem("id");
    const rol = localStorage.getItem("rol");

    console.log('redireccion - id:', id, 'rol:', rol);

    const roleRoutes: { [key: string]: string } = {
      profesional: '/profesional/perfil',
      contratador: '/contratador/perfil',
      admin: '/admin/perfil'
    };

    const ruta = roleRoutes[rol as string];
    router.navigateByUrl(ruta);
    return false;


    //hace que si estas logueado, no puedas acceder a access-denied
  }else{

    return true;
  }
}
