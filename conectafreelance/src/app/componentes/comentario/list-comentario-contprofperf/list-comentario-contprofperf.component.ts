import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { catchError, forkJoin, map, of, Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LoginService } from '../../../utils/service/login-service.service';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PromedioService } from '../../../utils/promedio.service';
import { UsuarioContratador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { UsuarioAdministradorService } from '../../usuario/usuarioAdmin/service/usuario-administrador.service';

@Component({
  selector: 'app-list-comentario-contprofperf',
  imports: [RouterModule],
  templateUrl: './list-comentario-contprofperf.component.html',
  styleUrl: './list-comentario-contprofperf.component.css'
})
export class ListComentarioContprofperfComponent implements OnInit, OnDestroy, OnChanges {

  @Input() comentarioNvo!: Comentario;
  @Output() puntajeAEliminar = new EventEmitter<number>();

  comentarios: Comentario[] = [];
  idDestinatario: string | null = null;
  idContratador: string = '';
  destroy$ = new Subject<void>();
  imgPerfCreadores: { [idCreador: string]: SafeUrl } = {};
  objectUrls: string[] = [];
  usuContratadores: UsuarioContratador[] = [];
  usuProf!: UsuarioProfesional;

  // Servicios
  loginService = inject(LoginService);
  comentarioService = inject(ComentarioService);
  contratadorService = inject(UsuarioContratadorService);
  imagenService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  listNotService = inject(NotificacionService);
  usuProfService = inject(UsuarioProfesionalService);
  usuAdmService = inject(UsuarioAdministradorService);
  promedioService = inject(PromedioService);

  ngOnInit(): void {
    this.idContratador = this.loginService.getId();
    this.inicializarListaComentarios();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['comentarioNvo'] && changes['comentarioNvo'].currentValue) {
      const nuevo = changes['comentarioNvo'].currentValue;
      this.comentarios = [nuevo, ...this.comentarios];
      this.obtenerUsuariosContratadores();
    }
  }

  inicializarListaComentarios() {
    this.obtenerIDdestinatario();
    this.obtenerComentariosADestinatario();
  }

  obtenerIDdestinatario() {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idDestinatario = param.get('id');
        if (!this.idDestinatario) {
          alert("Error: No se pudo obtener el ID del profesional. Redirigiendo...");
          this.router.navigate(['contratador/perfil']);
        } else {
          this.obtenerUsuarioProfesional();
        }
      },
      error: () => this.router.navigate(['contratador/perfil'])
    });
  }

  obtenerUsuarioProfesional() {
    this.usuProfService.getUsuariosProfesionalPorID(this.idDestinatario!).pipe(takeUntil(this.destroy$)).subscribe({
      next: (prof) => this.usuProf = prof,
      error: () => console.error("No se pudo cargar el profesional.")
    });
  }

  obtenerComentariosADestinatario() {
    if (!this.idDestinatario) return;

    this.comentarioService.getComentarioPorIDdestinatario(this.idDestinatario).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
          if(value.length > 0){
            value.forEach(c => this.promedioService.agregarPuntaje(c.puntaje))
            this.comentarios = value;
            this.obtenerUsuariosContratadores();
          }
        },
        error: (err) => {
          alert("Error al cargar comentarios.");
          console.error(err);
        }
      });
  }


  obtenerUsuariosContratadores() {
    const idsCreadores = [...new Set(this.comentarios.map(c => c.idCreador))];
    if (idsCreadores.length === 0) return;

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

        this.cargarImagenesContratadores(contratadoresValidos);
      }
    });
  }

  cargarImagenesContratadores(contratadores: { urlFoto: string; idCreador: string }[]) {
    if (contratadores.length === 0) return;

    const requests = contratadores.map(({ urlFoto, idCreador }) => {
      if (!urlFoto || this.imgPerfCreadores[idCreador]) {
        return of({ idCreador, url: 'skip' } as any);
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
        catchError(() => of({ idCreador, url: 'public/avatar.png' } as any))
      );
    });

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results) => {
        results.forEach(result => {
          if (result.url !== 'skip') {
            this.imgPerfCreadores[result.idCreador] = result.url;
          }
        });
      }
    });
  }

  getImagenContratador(idCreador: string): SafeUrl | string {
    return this.imgPerfCreadores[idCreador];
  }

  getUsuarioById(idCreador: string): UsuarioContratador | undefined {
    return this.usuContratadores.find(u => u.id === idCreador);
  }

  esComentarioPropio(idCreador: string): boolean {
    return idCreador === this.idContratador;
  }

  eliminar(idComentario: string | undefined) {
    if (!idComentario) return alert('Error: ID no válido.');

    const comentario = this.comentarios.find(c => c.id === idComentario);
    if (!comentario || !this.esComentarioPropio(comentario.idCreador)) {
      return alert('No puedes eliminar este comentario.');
    }

    if (!confirm('¿Eliminar tu comentario?')) return;

    this.comentarioService.eliminarComentario(idComentario).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.comentarios = this.comentarios.filter(c => c.id !== idComentario);
        this.puntajeAEliminar.emit(comentario.puntaje);
        this.notificarEliminacionAlProfesional();
        alert('Comentario eliminado');
      },
      error: () => alert('Error al eliminar comentario')
    });
  }

  notificarEliminacionAlProfesional() {
    if (!this.idDestinatario) return;

    this.listNotService.getListaNotificacionesPorIDUsuario(this.idDestinatario).pipe(takeUntil(this.destroy$)).subscribe({
      next: (listas) => {
        if (listas.length === 0) return;
        const lista = listas[0];
        const contratador = this.getUsuarioById(this.idContratador);
        const notif: Notificacion = {
          descripcion: `El usuario ${contratador?.nombreCompleto} eliminó su comentario.`,
          leido: false
        };
        lista.notificaciones.push(notif);
        this.actualizarListaNotificacion(lista);
      }
    });
  }

  reportarComentario(idComentario: string | undefined) {
    if (!idComentario) return alert('Error: comentario no válido.');
    const comentario = this.comentarios.find(c => c.id === idComentario);
    if (!comentario || this.esComentarioPropio(comentario.idCreador)) {
      return alert('No puedes reportar tu propio comentario.');
    }
    if (!confirm('¿Reportar este comentario?')) return;

    const updated = { ...comentario, reportada: true };
    this.comentarioService.putComentario(updated, idComentario).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        comentario.reportada = true;
        this.notificarReporteAlCreador(comentario.idCreador);
        this.notificarReporteAAdministradores(comentario.idCreador);
        alert('Comentario reportado');
      },
      error: () => alert('Error al reportar')
    });
  }

  notificarReporteAlCreador(idCreador: string) {
    this.listNotService.getListaNotificacionesPorIDUsuario(idCreador).pipe(takeUntil(this.destroy$)).subscribe({
      next: (listas) => {
        if (listas.length === 0) return;
        const lista = listas[0];
        const notif: Notificacion = {
          descripcion: `Tu comentario a ${this.usuProf.nombreCompleto} ha sido reportado.`,
          leido: false
        };
        lista.notificaciones.push(notif);
        this.actualizarListaNotificacion(lista);
      }
    });
  }

  notificarReporteAAdministradores(idReportado: string) {
    this.usuAdmService.getUsuariosAdministradores().pipe(takeUntil(this.destroy$)).subscribe({
      next: (admins) => {
        const adminsValidos = admins.filter(a => a.permisos === 'c' || a.permisos === 'cp');
        if (adminsValidos.length === 0) return;

        const requests = adminsValidos.map(admin =>
          this.listNotService.getListaNotificacionesPorIDUsuario(admin.id!).pipe(
            map(listas => ({ adminId: admin.id!, lista: listas[0] || null })),
            catchError(() => of({ adminId: admin.id!, lista: null }))
          )
        );

        forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
          next: (results) => {
            const listas: ListaNotificaciones[] = [];
            const creador = this.getUsuarioById(idReportado);

            results.forEach(({ lista }) => {
              if (lista) {
                lista.notificaciones.push({
                  descripcion: `Reporte: comentario de ${creador?.nombreCompleto} en perfil de ${this.usuProf.nombreCompleto}`,
                  leido: false
                });
                listas.push(lista);
              }
            });

            listas.forEach(l => this.actualizarListaNotificacion(l));
          }
        });
      }
    });
  }

  actualizarListaNotificacion(lista: ListaNotificaciones) {
    if (!lista.id) return;
    this.listNotService.putListaNotificaciones(lista, lista.id).pipe(takeUntil(this.destroy$)).subscribe();
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imgPerfCreadores = {};
  }
}
