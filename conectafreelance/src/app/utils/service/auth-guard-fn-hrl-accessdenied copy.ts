import { inject } from "@angular/core";
import { Router } from "@angular/router";

export const authGuardFnHrlAccessDenied = () =>{

  const router = inject(Router);

  //protege al access denied hrl

  if(localStorage.getItem("id")){
    return true;

  }else{
    router.navigateByUrl('/home');

    return false;
  }
}
