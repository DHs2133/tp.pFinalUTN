import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { catchError, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { UsuarioContratador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LoginService } from '../../../utils/service/login-service.service';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PromedioService } from '../../../utils/promedio.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';

@Component({
  selector: 'app-list-comentario-cont-perf',
  imports: [RouterModule],
  templateUrl: './list-comentario-cont-perf.component.html',
  styleUrl: './list-comentario-cont-perf.component.css'
})
export class ListComentarioContPerfComponent implements OnInit, OnDestroy {

  usuContratador!: UsuarioContratador;
  comentarios: Comentario[] = [];
  usuariosProf: { [id: string]: UsuarioProfesional | null } = {};
  imagenesProf: { [key: string]: SafeUrl } = {};
  idContratador: string = "";
  destroy$ = new Subject<void>();
  objectUrls: string[] = [];
  imagenUrl!: SafeUrl;
  listaNotificaciones: ListaNotificaciones = { id: "", idDuenio: "", notificaciones: [] };


  loginService = inject(LoginService);
  comentarioService = inject(ComentarioService);
  contratadorService = inject(UsuarioContratadorService);
  profService = inject(UsuarioProfesionalService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  promedioService = inject(PromedioService);
  listNotService = inject(NotificacionService);

  ngOnInit(): void {
    this.idContratador = this.loginService.getId();
    if (this.idContratador) {
      this.obtenerUsuarioContratador();
    }
  }

  obtenerUsuarioContratador() {
    this.contratadorService.getUsuariosContratadoresPorId(this.idContratador).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        this.usuContratador = value;
        this.cargarImagen(this.usuContratador.urlFoto);
        this.inicializarListaComentarios(value.id as string);
      },
      error: () => {
        alert("Error al obtener datos del usuario. Redirigiendo...");
        this.redirecciónHome();
      }
    });
  }

  inicializarListaComentarios(idContratador: string) {
    this.comentarioService.getComentarioPorIDcreador(idContratador).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        if (value.length > 0) {
          this.comentarios = value;
          this.validarYLimpiarComentariosInvalidos();
        }
      },
      error: () => {
        alert("Error al cargar comentarios.");
        this.redirecciónHome();
      }
    });
  }

  validarYLimpiarComentariosInvalidos(): void {
    const idsProfesionales = [...new Set(this.comentarios.map(c => c.idDestinatario))];
    const requests = idsProfesionales.map(id =>
      this.profService.getUsuariosProfesionalPorID(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results: (UsuarioProfesional | null)[]) => {
        const idsAEliminar: string[] = [];

        results.forEach((prof, index) => {
          const idProf = idsProfesionales[index];
          this.usuariosProf[idProf] = prof;

          if (prof === null) {
            const comentariosInvalidos = this.comentarios.filter(c => c.idDestinatario === idProf);
            idsAEliminar.push(...comentariosInvalidos.map(c => c.id!).filter(Boolean));
          } else {
            this.cargarImagenProfesional(prof.urlFoto, idProf);
          }
        });

        if (idsAEliminar.length > 0) {
          this.eliminarComentariosInvalidos(idsAEliminar);
        }
      }
    });
  }

  eliminarComentariosInvalidos(ids: string[]): void {
    const deleteRequests = ids.map(id =>
      this.comentarioService.eliminarComentario(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(deleteRequests).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.comentarios = this.comentarios.filter(c => !ids.includes(c.id!));
      }
    });
  }

  cargarImagen(fileName: string) {
    if (!fileName) return;
    this.imageService.getImagen(fileName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(url);
        this.objectUrls.push(url);
      }
    });
  }

  cargarImagenProfesional(fileName: string, idProfesional: string) {
    if (!fileName || this.imagenesProf[idProfesional]) return;

    this.imageService.getImagen(fileName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        this.imagenesProf[idProfesional] = this.sanitizer.bypassSecurityTrustUrl(url);
        this.objectUrls.push(url);
      },
      error: () => {
        this.imagenesProf[idProfesional] = 'public/avatar.png' as any;
      }
    });
  }

  estaActivada(idProf: string): boolean {
    const prof = this.usuariosProf[idProf];

    if(prof !== null && prof.activo === true){
      return true;

    }
    return false;
  }

  getUsuarioProfesional(id: string): UsuarioProfesional | undefined {
    const prof = this.usuariosProf[id];
    return prof && prof.activo ? prof : undefined;
  }

  irAPerfilProfesional(idDestinatario: string) {
    if (this.estaActivada(idDestinatario)) {
      this.router.navigate(['contratador/contprofperfil', idDestinatario]);
    }
  }

  eliminar(idComentario: string | undefined) {
    if (!idComentario) return;

    const comentario = this.comentarios.find(c => c.id === idComentario);
    if (!comentario) return;

    if (!confirm('¿Eliminar este comentario?')) return;

    this.comentarioService.eliminarComentario(idComentario).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.comentarios = this.comentarios.filter(c => c.id !== idComentario);
        this.emitirNotificacion(comentario.idDestinatario);
        alert('Comentario eliminado');
      },
      error: () => alert('Error al eliminar')
    });
  }

  emitirNotificacion(idProf: string) {
    this.listNotService.getListaNotificacionesPorIDUsuario(idProf).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        if (value.length > 0) {
          this.listaNotificaciones = value[0];
          const notif: Notificacion = {
            descripcion: `${this.usuContratador.nombreCompleto} eliminó un comentario`,
            leido: false
          };
          this.listaNotificaciones.notificaciones.push(notif);
          this.putListaDeNotificaciones(this.listaNotificaciones);
        }
      }
    });
  }

  putListaDeNotificaciones(lista: ListaNotificaciones) {
    if (lista.id) {
      this.listNotService.putListaNotificaciones(lista, lista.id).pipe(takeUntil(this.destroy$)).subscribe();
    }
  }

  redirecciónHome() {
    this.router.navigate(['/']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
  }
}
