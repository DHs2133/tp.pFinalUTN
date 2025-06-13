import { inject, Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { UsuarioContratadorService } from '../../componentes/usuario/usuarioContratador/service/usuario-contratador.service';
import { UsuarioProfesionalService } from '../../componentes/usuario/usuarioProfesional/service/usuario-profesional.service';
import { UsuarioAdministradorService } from '../../componentes/usuario/usuarioAdmin/service/usuario-administrador.service';

@Injectable({
  providedIn: 'root'
})
export class VerificacionService {
  private usuarioCont = inject(UsuarioContratadorService);
  private usuarioProf = inject(UsuarioProfesionalService);
  private usuarioAdm = inject(UsuarioAdministradorService);

  verificarUsuarioEnApis(email: string): Observable<boolean> {
    const usuarioContr$ = this.usuarioCont.getUsuariosContratadoresPorEmail(email);
    const usuarioProf$ = this.usuarioProf.getUsuariosProfesionalPorEmail(email);
    const usuarioAdm$ = this.usuarioAdm.getUsuariosAdministradoresPorEmail(email);

    return forkJoin([usuarioContr$, usuarioProf$, usuarioAdm$]).pipe(
      map(([usuarios1, usuarios2, usuarios3]) => {
      return (usuarios1?.length ?? 0) > 0 || (usuarios2?.length ?? 0) > 0 || (usuarios3?.length ?? 0) > 0;
      })
    );
  }



}
