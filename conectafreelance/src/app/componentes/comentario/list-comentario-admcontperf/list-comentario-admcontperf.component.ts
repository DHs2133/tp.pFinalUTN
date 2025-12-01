import { Component, inject } from '@angular/core';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { catchError, forkJoin, map, of, Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioAdministrador, UsuarioContratador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoginService } from '../../../utils/service/login-service.service';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { UsuarioAdministradorService } from '../../usuario/usuarioAdmin/service/usuario-administrador.service';
import { ServEntElimPorAdmService } from '../../entidadElimPorAdm/serviceEntElimPorAdmin/serv-ent-elim-por-adm.service';
import { noWhitespaceValidator } from '../../../utils/ValidadoresPersonalizados';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { EntElimPorAdm } from '../../entidadElimPorAdm/interfaceEntElimPorAdmin/int-ent-elim-por-adm';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';

@Component({
  selector: 'app-list-comentario-admcontperf',
  imports: [ReactiveFormsModule],
  templateUrl: './list-comentario-admcontperf.component.html',
  styleUrl: './list-comentario-admcontperf.component.css'
})
export class ListComentarioAdmcontperfComponent {


  comentarios: Comentario[] = [];
  idContratador: string | null = null;
  idAdm: string = '';
  destroy$ = new Subject<void>();

  imgPerfCreador: SafeUrl | null = null;
  imgPerfDestinatarios: { [idDestinatario: string]: SafeUrl } = {};
  objectUrls: string[] = [];

  usuAdm!: UsuarioAdministrador;
  contratador!: UsuarioContratador;
  profesionales: UsuarioProfesional[] = [];

  motivoControls: { [comentarioId: string]: FormControl } = {};

  loginService = inject(LoginService);
  comentarioService = inject(ComentarioService);
  contratadorService = inject(UsuarioContratadorService);
  profesionalService = inject(UsuarioProfesionalService);
  imagenService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  route = inject(ActivatedRoute);
  router = inject(Router);
  listNotService = inject(NotificacionService);
  usuAdmService = inject(UsuarioAdministradorService);
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
    this.obtenerIDContratador();
  }

  obtenerIDContratador() {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (params) => {
        this.idContratador = params.get('id');
        if (!this.idContratador) {
          alert('ID no válido. Redirigiendo al perfil.');
          this.router.navigate(['admin/perfil']);
        } else {
          this.cargarContratadorYComentarios();
        }
      },
      error: () => this.router.navigate(['admin/perfil'])
    });
  }

  cargarContratadorYComentarios() {
    if (!this.idContratador) return;

    this.contratadorService.getUsuariosContratadoresPorId(this.idContratador)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (contratador) => {
          if (!contratador) {
            alert('Contratador no encontrado.');
            this.router.navigate(['admin/perfil']);
            return;
          }
          this.contratador = contratador;
          this.cargarImagenCreador();
          this.obtenerComentariosDelContratador();
        },
        error: () => {
          alert('Error al cargar el contratador.');
          this.router.navigate(['admin/perfil']);
        }
      });
  }

  cargarImagenCreador() {
    if (!this.contratador?.urlFoto) {
      this.imgPerfCreador = 'public/avatar.png';
      return;
    }

    this.imagenService.getImagen(this.contratador.urlFoto)
      .pipe(
        takeUntil(this.destroy$),
        map(blob => {
          const url = URL.createObjectURL(blob);
          this.objectUrls.push(url);
          return this.sanitizer.bypassSecurityTrustUrl(url);
        }),
        catchError(() => of('public/avatar.png' as SafeUrl))
      )
      .subscribe(url => this.imgPerfCreador = url as SafeUrl);
  }

  obtenerComentariosDelContratador() {
    this.comentarioService.getComentarioPorIDcreador(this.idContratador!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (comentarios) => {
          this.comentarios = comentarios;
          if (comentarios.length > 0) {
            this.inicializarFormularios();
            this.cargarProfesionalesDestinatarios();
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
    this.comentarios.forEach(c => {
      this.motivoControls[c.id!] = new FormControl('', [
        Validators.required,
        Validators.minLength(50),
        Validators.maxLength(200),
        noWhitespaceValidator()
      ]);
    });
  }

  cargarProfesionalesDestinatarios() {
    const idsDestinatarios = [...new Set(this.comentarios.map(c => c.idDestinatario))].filter(Boolean) as string[];

    const requests = idsDestinatarios.map(id =>
      this.profesionalService.getUsuariosProfesionalPorID(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results) => {
        const validos: { urlFoto: string; idDestinatario: string }[] = [];

        results.forEach((prof, i) => {
          const id = idsDestinatarios[i];
          if (prof) {
            this.profesionales.push(prof);
            if (prof.urlFoto) validos.push({ urlFoto: prof.urlFoto, idDestinatario: id });
          }
        });

        this.cargarImagenesDestinatarios(validos);
      }
    });
  }

  cargarImagenesDestinatarios(profesionales: { urlFoto: string; idDestinatario: string }[]) {
    if (profesionales.length === 0) return;

    const requests = profesionales.map(({ urlFoto, idDestinatario }) => {
      if (this.imgPerfDestinatarios[idDestinatario]) {
        return of({ idDestinatario, url: 'skip' });
      }

      return this.imagenService.getImagen(urlFoto).pipe(
        map(blob => {
          const url = URL.createObjectURL(blob);
          this.objectUrls.push(url);
          return { idDestinatario, url: this.sanitizer.bypassSecurityTrustUrl(url) };
        }),
        catchError(() => of({ idDestinatario, url: 'public/avatar.png' }))
      );
    });

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe(results => {
      results.forEach(r => {
        if (r.url !== 'skip') {
          this.imgPerfDestinatarios[r.idDestinatario] = r.url as SafeUrl;
        }
      });
    });
  }

  getProfesionalById(id: string): UsuarioProfesional | undefined {
    return this.profesionales.find(p => p.id === id);
  }

  getImagenDestinatario(id: string): SafeUrl {
    return this.imgPerfDestinatarios[id] || 'public/avatar.png';
  }

aprobar(comReportado: Comentario) {
  const comentarioActualizado: Comentario = {
    ...comReportado,
    controlado: true,
    reportada: false,
  };

  this.comentarioService.putComentario(comentarioActualizado, comentarioActualizado.id!)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: () => {
        alert("Comentario aprobado correctamente.");

        const textoCorto = comReportado.contenido.substring(0, 50) + (comReportado.contenido.length > 50 ? '...' : '');

        this.notificarUsuario(
          comReportado.idCreador,
          `El administrador ${this.usuAdm.nombreCompleto} revisó y aprobó tu comentario: "${textoCorto}". Ya no está reportado.`,
          null
        );

        this.notificarUsuario(
          comReportado.idDestinatario,
          `El administrador ${this.usuAdm.nombreCompleto} revisó el comentario que reportaste: "${textoCorto}" y decidió mantenerlo.`,
          null
        );

        this.comentarios = this.comentarios.map(c =>
          c.id === comReportado.id ? comentarioActualizado : c
        );
      },
      error: () => alert("Error al aprobar el comentario.")
    });
}

  eliminar(idComentario: string | undefined) {
    if (!idComentario) return;

    const control = this.motivoControls[idComentario];
    if (!control || control.invalid) {
      control?.markAsTouched();
      return;
    }

    const motivo = control.value.trim();
    const comentario = this.comentarios.find(c => c.id === idComentario);
    if (!comentario) return;

    if (!confirm(`¿Eliminar comentario? Motivo: "${motivo}"`)) return;

    this.comentarioService.eliminarComentario(idComentario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.crearEntidadEliminada(comentario, idComentario, motivo);

          this.comentarios = this.comentarios.filter(c => c.id !== idComentario);
          delete this.motivoControls[idComentario];

          this.updateUsuarioContratador(comentario.idCreador);

          this.notificarEliminacion(comentario.idCreador, comentario.idDestinatario, motivo, idComentario);
          alert('Comentario eliminado correctamente.');
        },
        error: () => alert('Error al eliminar el comentario.')
      });
  }

  crearEntidadEliminada(comentario: Comentario, idComentario: string, motivo: string) {
    const { id, ...sinId } = comentario;
    const entidad: EntElimPorAdm = {
      id: idComentario,
      idDuenio: comentario.idCreador,
      tipo: 'comentario',
      motivo,
      entidadElim: sinId
    };

    this.entElimPorAdmService.postEntElimPorAdm(entidad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => console.log('Entidad eliminada guardada'),
        error: (err) => {
          console.error(err);
          alert('Error al guardar registro de eliminación');
        }
      });
  }

  updateUsuarioContratador(idCont: string) {
    const usuario = this.contratador;
    if (!usuario) return;

    const actualizado: UsuarioContratador = {
      ...usuario,
      cantComRep: (usuario.cantComRep || 0) + 1,
      activo: (usuario.cantComRep || 0) + 1 >= 3 ? false : usuario.activo
    };

    this.contratadorService.putUsuariosContratadores(actualizado, idCont)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.contratador = res;
        },
        error: () => alert("Error al actualizar strikes del usuario.")
      });
  }

  notificarEliminacion(idCreador: string, idDestinatario: string, motivo: string, idCom: string) {
    this.notificarUsuario(idCreador, `El administrador ${this.usuAdm.nombreCompleto} eliminó un comentario que realizaste. Motivo: "${motivo}".`, idCom);
    this.notificarUsuario(idDestinatario, `El administrador ${this.usuAdm.nombreCompleto} eliminó un comentario que recibiste. Motivo: "${motivo}".`, idCom);
  }

  notificarUsuario(idUsuario: string, mensaje: string, idEnt: string | null = null) {
    this.listNotService.getListaNotificacionesPorIDUsuario(idUsuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (listas) => {
          if (listas.length === 0) return;

          const lista = listas[0];
          const notificacion: Notificacion = {
            idEnt: idEnt ?? undefined,
            descripcion: mensaje,
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
      .subscribe();
  }

  irAPerfilProfesional(id: string) {
    this.router.navigate(['admin/admprofperfil', id]);
  }

  irAPerfilContratador(idContratador: string){
    this.router.navigate(['admin/perfAdmCont', idContratador]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imgPerfDestinatarios = {};
  }


}
