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
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { noWhitespaceValidator } from '../../../utils/ValidadoresPersonalizados';
import { ServEntElimPorAdmService } from '../../entidadElimPorAdm/serviceEntElimPorAdmin/serv-ent-elim-por-adm.service';
import { EntElimPorAdm } from '../../entidadElimPorAdm/interfaceEntElimPorAdmin/int-ent-elim-por-adm';

@Component({
  selector: 'app-list-comentario-admprofperf',
  imports: [ReactiveFormsModule],
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


  //Este mapa me va a servir para utilizar un formulario para múltiples comentarios
  motivoControls: { [comentarioId: string]: FormControl } = {};



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
  entElimPorAdmService = inject(ServEntElimPorAdmService);




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
            this.inicializarFormularios();
            this.cargarUsuariosCreadores();
          }
        },
        error: (err) => {
          console.error('Error al obtener comentarios:', err);
          alert('No se pudieron cargar los comentarios.');
        }
      });
  }


  inicializarFormularios() {
    this.motivoControls = {};
    this.comentarios.forEach(comentario => {
      this.motivoControls[comentario.id!] = new FormControl('', [
        Validators.required,
        Validators.minLength(50),
        Validators.maxLength(200),
        noWhitespaceValidator()
      ]);
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

  aprobar(comReportado: Comentario) {
    const comentarioActualizado = {
      ...comReportado,
      controlado: true,
      reportada: false,
    };

    this.comentarioService.putComentario(comentarioActualizado, comentarioActualizado.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert("Publicación aprobada correctamente.");

          const textoCorto = comReportado.contenido.substring(0, 50) + (comReportado.contenido.length > 50 ? '...' : '');

          this.notificarUsuario(
            comReportado.idCreador,
            `El administrador ${this.usuAdm.nombreCompleto} revisó y aprobó tu comentario: "${textoCorto}". Ya no está reportada.`,
            comReportado.id as string
          );

          this.notificarUsuario(
            comReportado.idDestinatario,
            `El administrador ${this.usuAdm.nombreCompleto} revisó la publicación que reportaste: "${textoCorto}" y decidió mantenerla.`,
            comReportado.id as string
          );


          this.comentarios = this.comentarios.map(c =>
            c.id === comReportado.id ? comentarioActualizado : c
          );
        },
        error: () => alert("Error al aprobar la publicación.")
      });
  }


  eliminar(idComentario: string | undefined) {
    if (!idComentario) {
      alert('Error: ID de comentario no válido.');
      return;
    }

    const control = this.motivoControls[idComentario];
    if (!control || control.invalid) {
      control?.markAsTouched();
      return;
    }

    const motivo = control.value.trim();
    const comentario = this.comentarios.find(c => c.id === idComentario);
    if (!comentario) return;

    if (!confirm(`¿Eliminar comentario? Motivo: "${motivo}"`)) return;

    const idDestinatario = comentario.idDestinatario;

    this.comentarioService.eliminarComentario(idComentario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.crearEntidadEliminada(comentario, idComentario, motivo);

          this.comentarios = this.comentarios.filter(c => c.id !== idComentario);
          delete this.motivoControls[idComentario];
          this.puntajeAEliminar.emit(comentario.puntaje);
          this.updateUsuarioContratador(comentario.idCreador);

          this.notificarEliminacion(comentario.idCreador, motivo, idComentario, idDestinatario)

          alert('Comentario eliminado correctamente.');
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('No se pudo eliminar el comentario.');
        }
      });
  }

  crearEntidadEliminada(comentario: Comentario, idComentario: string, motivo: string) {

    const { id, ...comentarioSinId } = comentario;

    const entidadEliminada: EntElimPorAdm = {
      id: idComentario,
      idDuenio: comentario.idCreador,
      tipo: 'comentario',
      motivo: motivo,
      entidadElim: comentarioSinId
    };

    this.entElimPorAdmService.postEntElimPorAdm(entidadEliminada)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          console.log('Entidad eliminada guardada:', entidadEliminada);
        },
        error: (err) => {
          console.error('Error al guardar entidad eliminada:', err);
          alert("Error al guardar entidad eliminada: " + err);
        }
      });
  }

  updateUsuarioContratador(idCont: string | null | undefined) {

    let usuCont;
    let usuarioActualizado;

    if(idCont){
      usuCont = this.usuContratadores.find(uc => uc.id === idCont);
    }

    if(usuCont){
      usuarioActualizado = {
        ...usuCont,
        cantComRep: (usuCont!.cantComRep || 0) + 1,
        activo: (usuCont!.cantComRep || 0) + 1 >= 3 ? false : usuCont!.activo
      };
    }

    if(usuarioActualizado){
      this.contratadorService.putUsuariosContratadores(usuarioActualizado, usuarioActualizado!.id as string)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (value) =>{
              this.usuContratadores = this.usuContratadores.map(uc =>
              uc.id === value.id ? value : uc
            );
            alert("Strikes actualizados.")
          },
          error: () => alert("Error al actualizar strikes.")
        });
    }
  }


  notificarEliminacion(
    idCreador: string,
    motivo: string,
    idCom: string,
    idDestinatario: string | null | undefined
  ) {

    this.notificarUsuario(
      idCreador,
      `El administrador ${this.usuAdm.nombreCompleto} eliminó un comentario realizado por usted. Motivo: "${motivo}". Apriete para ver más detalles`,
      idCom
    );

    if (idDestinatario) {
      this.notificarUsuario(
        idDestinatario,
        `El administrador ${this.usuAdm.nombreCompleto} eliminó un comentario que recibiste. Motivo: "${motivo}".`,
        idCom
      );
    }
  }


  notificarUsuario(idUsuario: string, mensaje: string, idEnt: string) {
    this.listNotService.getListaNotificacionesPorIDUsuario(idUsuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (listas) => {
          if (listas.length === 0){

            alert("No se pudo notificar debidamente a los usuarios de la acción realizada.");
            return;
          }

          const lista = listas[0];
          const notificacion: Notificacion = {
            idEnt: idEnt,
            descripcion: mensaje,
            leido: false
          };

          lista.notificaciones.push(notificacion);
          this.actualizarListaNotificacion(lista);
        },
        error: (err) => console.error('Error al notificar usuario:', idUsuario, err)
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


  irAPerfilContratador(idContratador: string){
    this.router.navigate(['admin/perfAdmCont', idContratador]);

  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imgPerfCreadores = {};
  }

}
