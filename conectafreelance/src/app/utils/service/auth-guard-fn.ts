import { inject } from "@angular/core"
import { Router } from "@angular/router";

export const authGuardFn = () =>{

  //protege a las página que no sean home, registro y login (hrl)
  const router = inject(Router);


  if(localStorage.getItem("id")){
    return true;

  }else{
    router.navigateByUrl('/access-denied')
    return false;
  }
}
