import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { UsuarioContratadorService } from '../componentes/usuario/usuarioContratador/service/usuario-contratador.service';
import { UsuarioProfesionalService } from '../componentes/usuario/usuarioProfesional/service/usuario-profesional.service';

@Injectable({
  providedIn: 'root'
})
export class VerificacionService {
  private usuarioCont = inject(UsuarioContratadorService);
  private usuarioProf = inject(UsuarioProfesionalService);

  verificarUsuarioEnAmbasApis(email: string): Observable<boolean> {
    const usuarioContr$ = this.usuarioCont.getUsuariosContratadorPorEmail(email);
    const usuarioProf$ = this.usuarioProf.getUsuariosProfesionalPorEmail(email);

    return forkJoin([usuarioContr$, usuarioProf$]).pipe(
      map(([usuarios1, usuarios2]) => {
      return (usuarios1?.length ?? 0) > 0 || (usuarios2?.length ?? 0) > 0;
      })
      );




    /*new Observable<boolean>(subscriber => {
      forkJoin([usuarioContr$, usuarioProf$]).subscribe({
        next: ([usuarios1, usuarios2]) => {
          const existe = usuarios1.length > 0 || usuarios2.length > 0;
          subscriber.next(existe);
          subscriber.complete();
        },
        error: err => subscriber.error(err)
      });
    });
    */
  }
}
