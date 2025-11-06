import { inject } from "@angular/core"
import { Router } from "@angular/router";

export const authGuardFnHrl = () =>{

  const router = inject(Router);

  //protege a las página que no sean home, registro y login (hrl)

  if(!localStorage.getItem("id")){
    return true;

  }else{

    router.navigateByUrl('/access-denied-hrl');
    return false;
  }
}
