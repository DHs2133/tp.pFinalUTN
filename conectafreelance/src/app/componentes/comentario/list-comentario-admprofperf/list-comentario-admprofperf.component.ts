import { Component, EventEmitter, inject, Output, SimpleChange } from '@angular/core';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { catchError, forkJoin, map, of, Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioAdministrador, UsuarioContratador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { LoginService } from '../../../utils/service/login-service.service';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { ImageService } from '../../../service/back-end/image.service';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { UsuarioAdministradorService } from '../../usuario/usuarioAdmin/service/usuario-administrador.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { ActivatedRoute, Router } from '@angular/router';
import { PromedioService } from '../../../utils/promedio.service';

@Component({
  selector: 'app-list-comentario-admprofperf',
  imports: [],
  templateUrl: './list-comentario-admprofperf.component.html',
  styleUrl: './list-comentario-admprofperf.component.css'
})
export class ListComentarioAdmprofperfComponent {


  @Output() puntajeAEliminar = new EventEmitter<number>();

  comentarios: Comentario[] = [];
  idDestinatario: string | null = null;
  idAdm: string = '';
  destroy$ = new Subject<void>();
  imgPerfCreadores: { [idCreador: string]: SafeUrl } = {};
  objectUrls: string[] = [];
  usuContratadores: UsuarioContratador[] = [];
  usuAdm!: UsuarioAdministrador;

  loginService = inject(LoginService);
  comentarioService = inject(ComentarioService);
  contratadorService = inject(UsuarioContratadorService);
  imagenService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  route = inject(ActivatedRoute);
  router = inject(Router);
  listNotService = inject(NotificacionService);
  usuAdmService = inject(UsuarioAdministradorService);
  promedioService = inject(PromedioService);

  ngOnInit(): void {
    this.idAdm = this.loginService.getId();
    this.obtenerUsuarioAdministrador();
    this.inicializarListaComentarios();
  }

  obtenerUsuarioAdministrador() {
    this.usuAdmService.getUsuariosAdministradoresPorID(this.idAdm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (admin) => this.usuAdm = admin,
        error: () => {
          alert('Error al obtener datos del administrador.');
          this.router.navigate(['admin/perfil']);
        }
      });
  }

  inicializarListaComentarios() {
    this.obtenerIDdestinatario();
  }

  obtenerIDdestinatario() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (params) => {
        this.idDestinatario = params.get('id');
        if (!this.idDestinatario) {
          alert('ID no válido. Redirigiendo al perfil.');
          this.router.navigate(['admin/perfil']);
        } else {
          this.obtenerComentariosADestinatario();
        }
      },
      error: () => this.router.navigate(['admin/perfil'])
    });
  }

  obtenerComentariosADestinatario() {
    if (!this.idDestinatario) return;

    this.comentarioService.getComentarioPorIDdestinatario(this.idDestinatario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comentarios) => {
          if (comentarios.length > 0) {
            comentarios.forEach(c => this.promedioService.agregarPuntaje(c.puntaje));
            this.comentarios = comentarios;
            this.cargarUsuariosCreadores();
          }
        },
        error: (err) => {
          console.error('Error al obtener comentarios:', err);
          alert('No se pudieron cargar los comentarios.');
        }
      });
  }

  cargarUsuariosCreadores() {
    const idsCreadores = [...new Set(this.comentarios.map(c => c.idCreador))];

    const requests = idsCreadores.map(id =>
      this.contratadorService.getUsuariosContratadoresPorId(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results) => {
        const contratadoresValidos: { urlFoto: string; idCreador: string }[] = [];

        results.forEach((contratador, index) => {
          const idCreador = idsCreadores[index];
          if (contratador) {
            this.usuContratadores.push(contratador);
            contratadoresValidos.push({ urlFoto: contratador.urlFoto, idCreador });
          }
        });

        this.cargarImagenesPerfil(contratadoresValidos);
      },
      error: (err) => console.error('Error cargando contratadores:', err)
    });
  }

  cargarImagenesPerfil(contratadores: { urlFoto: string; idCreador: string }[]) {
    if (contratadores.length === 0) return;

    const requests = contratadores.map(({ urlFoto, idCreador }) => {
      if (!urlFoto || this.imgPerfCreadores[idCreador]) {
        return of({ idCreador, url: 'skip' });
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
        catchError(() => of({ idCreador, url: 'public/avatar.png' }))
      );
    });

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results) => {
        results.forEach(result => {
          if (result.url !== 'skip') {
            this.imgPerfCreadores[result.idCreador] = result.url as SafeUrl;
          }
        });
      }
    });
  }

  getUsuarioById(idCreador: string): UsuarioContratador | undefined {
    return this.usuContratadores.find(u => u.id === idCreador);
  }

  getImagenPerfil(idCreador: string): SafeUrl {
    return this.imgPerfCreadores[idCreador] || 'public/avatar.png';
  }


  eliminar(idComentario: string | undefined) {
    if (!idComentario) {
      alert('Error: ID de comentario no válido.');
      return;
    }

    const comentario = this.comentarios.find(c => c.id === idComentario);
    if (!comentario) {
      alert('Comentario no encontrado.');
      return;
    }

    if (!confirm('¿Estás seguro de eliminar este comentario?')) return;

    this.comentarioService.eliminarComentario(idComentario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.comentarios = this.comentarios.filter(c => c.id !== idComentario);
          this.puntajeAEliminar.emit(comentario.puntaje);
          this.notificarEliminacion(comentario.idCreador);
          alert('Comentario eliminado correctamente.');
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('No se pudo eliminar el comentario.');
        }
      });
  }

  notificarEliminacion(idCreador: string) {
    const contratador = this.getUsuarioById(idCreador);
    if (!contratador) return;

    this.listNotService.getListaNotificacionesPorIDUsuario(idCreador)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (listas) => {
          if (listas.length === 0) return;

          const lista = listas[0];
          const notificacion: Notificacion = {
            descripcion: `El administrador ${this.usuAdm.nombreCompleto} eliminó tu comentario por incumplir normas.`,
            leido: false
          };

          lista.notificaciones.push(notificacion);
          this.actualizarListaNotificacion(lista);
        }
      });
  }

  actualizarListaNotificacion(lista: ListaNotificaciones) {
    if (!lista.id) return;

    this.listNotService.putListaNotificaciones(lista, lista.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (err) => console.error('Error actualizando notificación:', err)
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imgPerfCreadores = {};
  }

}
