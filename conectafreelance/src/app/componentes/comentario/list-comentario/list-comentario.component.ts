import { LoginService } from './../../../utils/service/login-service.service';
import { Component, EventEmitter, inject, OnInit, Output } from '@angular/core';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { catchError, forkJoin, map, of, Subject, takeUntil } from 'rxjs';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { ImageService } from '../../../service/back-end/image.service';
import { CommonModule } from '@angular/common';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { UsuarioAdministrador, UsuarioContratador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { UsuarioAdministradorService } from '../../usuario/usuarioAdmin/service/usuario-administrador.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';

@Component({
  selector: 'app-list-comentario',
  imports: [CommonModule],
  templateUrl: './list-comentario.component.html',
  styleUrl: './list-comentario.component.css'
})
export class ListComentarioComponent implements OnInit {



  comentarios: Comentario[] = [];
  idDestinatario: string = "";
  destroy$ = new Subject<void>();
  imgPerfCreadores: { [idCreador: string]: SafeUrl } = {};
  objectUrls: string[] = [];
  usuContratadores: UsuarioContratador[] = [];
  usuProf!: UsuarioProfesional;

  loginService = inject(LoginService);
  comentarioService = inject(ComentarioService);
  imagenService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  contratadorService = inject(UsuarioContratadorService);
  listNotService = inject(NotificacionService);
  usuAdmService = inject(UsuarioAdministradorService);
  usuProfService = inject(UsuarioProfesionalService);

  ngOnInit(): void {
    this.inicializarListaComentarios();
  }

  inicializarListaComentarios() {
    this.obtenerIDdestinatario();
    this.obtenerUsuarioProfesionalActual();
    this.obtenerComentariosADestinatario();
  }

  obtenerIDdestinatario() {
    this.idDestinatario = this.loginService.getId();
  }

  obtenerUsuarioProfesionalActual() {
    this.usuProfService.getUsuariosProfesionalPorID(this.idDestinatario).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        this.usuProf = value;
      },
      error: () => {
        console.error("No se pudo obtener al usuario profesional de sesión.");
      }
    });
  }

  obtenerComentariosADestinatario() {
    this.comentarioService.getComentarioPorIDdestinatario(this.idDestinatario).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
          if (value.length > 0) {
            this.comentarios = value;
            this.obtenerUsuariosContratadores();
          }
        },
        error: (err) => {
          alert("Error. No se pudo obtener los comentarios realizados a este usuario");
          console.error("Error: ", err);
        }
      });
  }

  obtenerUsuariosContratadores(){
    const idsCreadores = [...new Set(this.comentarios.map(c => c.idCreador))];

    const requests = idsCreadores.map(id =>
      this.contratadorService.getUsuariosContratadoresPorId(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results: (UsuarioContratador | null)[]) => {

        const contratadoresValidos: { urlFoto: string; idCreador: string }[] = [];

        results.forEach((contratador, index) => {
          const idCreador = idsCreadores[index];

          if (contratador !== null) {
            this.usuContratadores.push(contratador);
            contratadoresValidos.push({ urlFoto: contratador.urlFoto, idCreador });
          }
        });

        this.cargarImagenesContratadores(contratadoresValidos);
      },
      error: (err) => {
        console.error('Error al validar contratadores:', err);
      }
    });
  }

  cargarImagenesContratadores(contratadores: { urlFoto: string; idCreador: string }[]) {
    if (contratadores.length === 0) return;

    const requests = contratadores.map(({ urlFoto, idCreador }) => {
      if (!urlFoto || this.imgPerfCreadores[idCreador]) {
        return of({ idCreador, url: 'skip' as any });
      }

      return this.imagenService.getImagen(urlFoto).pipe(
        map(blob => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrls.push(objectUrl);
          return {
            idCreador,
            url: this.sanitizer.bypassSecurityTrustUrl(objectUrl)
          };
        }),
        catchError(() => {
          return of({
            idCreador,
            url: 'public/avatar.png' as any
          });
        })
      );
    });

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results) => {
        results.forEach(result => {
          if (result.url !== 'skip') {
            this.imgPerfCreadores[result.idCreador] = result.url;
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar imágenes:', err);
      }
    });
  }

  getUsuarioById(idCreador: string): UsuarioContratador | undefined {
    return this.usuContratadores.find(u => u.id === idCreador);
  }

  getImagenContratador(idCreador: string): SafeUrl {
    return this.imgPerfCreadores[idCreador] || 'public/avatar.png';
  }

  esUsuarioActivo(idCont: string){
    const usuCont = this.usuContratadores.find(u => u.id === idCont);

    if(usuCont && usuCont.activo){
      return true;
    }

    return false;
  }

  reportarComentario(idComentario: string | undefined) {
    if (!idComentario) {
      alert('Error. No se ha podido reportar el comentario');
      return;
    }

    const comentario = this.comentarios.find(c => c.id === idComentario);
    if (!comentario) {
      alert('Comentario no encontrado');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas reportar este comentario?')) return;

    const updatedComentario = { ...comentario, reportada: true };

    this.comentarioService.putComentario(updatedComentario, idComentario).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        comentario.reportada = true;
        this.emitirNotificacion(comentario.idCreador);
        this.obtenerUsuariosAdministradores(comentario.idCreador);
        alert('Comentario reportado');
      },
      error: (err) => {
        console.error('Error al reportar el comentario:', err);
        alert('No se pudo reportar el comentario');
      }
    });
  }
































  emitirNotificacion(idCreador: string) {
    this.listNotService.getListaNotificacionesPorIDUsuario(idCreador).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {

        if(value.length > 0){
          const lista = value[0];
          const notificacion: Notificacion = {
            descripcion: `Su comentario a ${this.usuProf.nombreCompleto} ha sido reportado.`,
            leido: false
          };
          lista.notificaciones.push(notificacion);
          this.actualizarListasNotificaciones([lista]);
        }

      },
      error: () => {
        console.warn('No se pudo notificar al contratador (lista no encontrada)');
      }
    });
  }

  obtenerUsuariosAdministradores(idUsuReportado: string) {
    this.usuAdmService.getUsuariosAdministradores().pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        if (value.length > 0) {
          this.obtenerListNotifDeAdm(value, idUsuReportado);
        }
      },
      error: (err) => {
        console.error('Error al obtener administradores:', err);
      }
    });
  }

  obtenerListNotifDeAdm(usuAdm: UsuarioAdministrador[], idUsuReportado: string) {
    const usuAdmFilt = usuAdm.filter(ua => ua.permisos === 'c' || ua.permisos === 'cp');
    if (usuAdmFilt.length === 0) return;

    const requests = usuAdmFilt.map(ua =>
      this.listNotService.getListaNotificacionesPorIDUsuario(ua.id as string).pipe(
        map(lists => ({
          adminId: ua.id as string,
          lista: lists.length > 0 ? lists[0] : null
        })),
        catchError(() => of({ adminId: ua.id as string, lista: null }))
      )
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results) => {
        const listasParaActualizar: ListaNotificaciones[] = [];

        results.forEach(({ lista }) => {
          const usuCont = this.getUsuarioById(idUsuReportado);
          const descripcion = `Se ha reportado un comentario del usuario: ${usuCont?.nombreCompleto}`;

          const notificacion: Notificacion = {
            descripcion,
            leido: false
          };

          if (lista) {
            lista.notificaciones.push(notificacion);
            listasParaActualizar.push(lista);
          }
        });

        this.actualizarListasNotificaciones(listasParaActualizar);
      },
      error: (err) => {
        console.error('Error al procesar notificaciones para administradores:', err);
      }
    });
  }

  actualizarListasNotificaciones(listas: ListaNotificaciones[]) {
    if (listas.length === 0) return;

    const updates$ = listas
      .filter(l => l.id)
      .map(l =>
        this.listNotService.putListaNotificaciones(l, l.id!).pipe(
          catchError(err => {
            console.error('Error al actualizar lista de notificaciones:', err);
            return of(null);
          })
        )
      );

    forkJoin(updates$).pipe(takeUntil(this.destroy$)).subscribe();
  }












































  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imgPerfCreadores = {};
  }

}
