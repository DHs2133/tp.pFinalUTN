import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { catchError, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { UsuarioAdministrador, UsuarioContratador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { noWhitespaceValidator } from '../../../utils/ValidadoresPersonalizados';
import { EntElimPorAdm } from '../../entidadElimPorAdm/interfaceEntElimPorAdmin/int-ent-elim-por-adm';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { UsuarioAdministradorService } from '../../usuario/usuarioAdmin/service/usuario-administrador.service';
import { ServEntElimPorAdmService } from '../../entidadElimPorAdm/serviceEntElimPorAdmin/serv-ent-elim-por-adm.service';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';

@Component({
  selector: 'app-list-comentario-reportado',
  imports: [ReactiveFormsModule],
  templateUrl: './list-comentario-reportado.component.html',
  styleUrl: './list-comentario-reportado.component.css'
})
export class ListComentarioReportadoComponent implements OnInit, OnDestroy{


  destroy$ = new Subject<void>();
  comentarioUsuario: Comentario[] = [];
  imagenesPerfil: { [key: string]: SafeUrl } = {};
  usuariosCont: UsuarioContratador[] = [];
  usuariosProf: UsuarioProfesional[] = [];
  objectUrlsPerfil: string[] = [];

  //Este mapa me va a servir para utilizar un formulario para múltiples comentarios
  motivoControls: { [comentarioId: string]: FormControl } = {};

  // Admin
  usuAdm!: UsuarioAdministrador;
  idAdm: string = '';


  // Servicios
  comentarioService = inject(ComentarioService);
  contratadorService = inject(UsuarioContratadorService);
  loginServ = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  listNotService = inject(NotificacionService);
  usuAdmService = inject(UsuarioAdministradorService);
  entElimPorAdmService = inject(ServEntElimPorAdmService);
  usuProfService = inject(UsuarioProfesionalService);

  ngOnInit(): void {
    this.idAdm = this.loginServ.getId();
    this.obtenerUsuarioAdministrador();
    this.getListaDeComentarios();
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

  getListaDeComentarios() {
    this.comentarioService.getComentariosReportados()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
          this.comentarioUsuario = value || [];
          if (this.comentarioUsuario.length > 0) {
            this.cargarDatosCreadores();
            this.cargarDatosDestinatarios();
            this.inicializarFormularios();
          }
        },
        error: (err) => {
          console.error('Error al obtener comentarios reportados:', err);
        }
      });
  }


  cargarDatosDestinatarios() {
    const idsDestinatarios = [...new Set(this.comentarioUsuario.map(c => c.idDestinatario))];

    const requests = idsDestinatarios.map(id =>
      this.usuProfService.getUsuariosProfesionalPorID(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results) => {
        results.forEach((profesional) => {
          if (profesional) {
            this.usuariosProf.push(profesional);
            this.obtenerImagenPerfilDelServidorProfesional(profesional);
          }
        });
      }
    });
  }



  obtenerImagenPerfilDelServidorProfesional(profesional: UsuarioProfesional) {
    if (!profesional.urlFoto || this.imagenesPerfil[profesional.id!]) return;

    this.imageService.getImagen(profesional.urlFoto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrlsPerfil.push(objectUrl);
          this.imagenesPerfil[profesional.id!] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: () => {
          this.imagenesPerfil[profesional.id!] = 'public/avatar.png' as any;
        }
      });
  }



  cargarDatosCreadores() {
    const idsCreadores = [...new Set(this.comentarioUsuario.map(c => c.idCreador))];

    const requests = idsCreadores.map(id =>
      this.contratadorService.getUsuariosContratadoresPorId(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results) => {
        results.forEach((contratador, index) => {
          const idCreador = idsCreadores[index];
          if (contratador) {
            this.usuariosCont.push(contratador);
            this.obtenerImagenPerfilDelServidor(contratador);
          }
        });
      }
    });
  }

  obtenerImagenPerfilDelServidor(usuCont: UsuarioContratador) {
    if (!usuCont.urlFoto || this.imagenesPerfil[usuCont.id!]) return;

    this.imageService.getImagen(usuCont.urlFoto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrlsPerfil.push(objectUrl);
          this.imagenesPerfil[usuCont.id!] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: () => {
          this.imagenesPerfil[usuCont.id!] = 'public/avatar.png' as any;
        }
      });
  }

  getUsuarioContratadorById(id: string): UsuarioContratador | undefined {
    return this.usuariosCont.find(u => u.id === id);
  }

  getUsuarioProfesionalById(id: string): UsuarioProfesional | undefined {
    return this.usuariosProf.find(u => u.id === id);
  }

  inicializarFormularios() {
    this.motivoControls = {};
    this.comentarioUsuario.forEach(comentario => {
      this.motivoControls[comentario.id!] = new FormControl('', [
        Validators.required,
        Validators.minLength(50),
        Validators.maxLength(200),
        noWhitespaceValidator()
      ]);
    });
  }

  controlar(comReportado: Comentario, decision: "aprobar" | "eliminar") {
    if (decision === "aprobar") {
      if (!confirm('¿Aprobar comentario reportado?')) return;
      this.aprobado(comReportado);
      this.comentarioUsuario = this.comentarioUsuario.filter(c => c.id !== comReportado.id);
      return;
    }

    const control = this.motivoControls[comReportado.id!];
    if (!control || control.invalid) {
      control?.markAsTouched();
      return;
    }

    const motivo = control.value.trim();
    if (!confirm(`¿Eliminar comentario? Motivo: "${motivo}"`)) return;

    this.eliminarComentarioCompleto(comReportado, motivo);
  }


  aprobado(comReportado: Comentario) {
    comReportado.controlado = true;
    comReportado.reportada = false;

    if (comReportado.id) {
      this.comentarioService.putComentario(comReportado, comReportado.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert("Comentario aprobado.");

            this.notificarAprobacion(comReportado.idCreador, comReportado.idDestinatario, comReportado.id as string)


          },
          error: () => alert("Error al aprobar.")
        });
    }
  }

  eliminarComentarioCompleto(comentario: Comentario, motivo: string) {
    if (!comentario.id) return;

    const idComentario = comentario.id;
    const idCreador = comentario.idCreador;
    const idDestinatario = comentario.idDestinatario;

    this.comentarioService.eliminarComentario(idComentario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.crearEntidadEliminada(comentario, idComentario, motivo);

          this.comentarioUsuario = this.comentarioUsuario.filter(c => c.id !== idComentario);
          delete this.motivoControls[idComentario];

          this.updateUsuarioContratador(comentario.idCreador);
          this.notificarEliminacion(idCreador, idDestinatario, motivo, idComentario);

          alert('Comentario eliminado correctamente.');
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('No se pudo eliminar el comentario.');
        }
      });
  }

  updateUsuarioContratador(idCreador: string) {
    let usuarioCont = this.usuariosCont.find(up => up.id === idCreador)!;


    const strike = (usuarioCont.cantComRep || 0) + 1;

    if (strike >= 3) {
      usuarioCont.activo = false;
    }

    usuarioCont.cantComRep = strike;

    this.contratadorService.putUsuariosContratadores(usuarioCont, usuarioCont.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next : (value) => {
          alert("Se ha actualizado los strikes del usuario.");
        },
        error : (err) => {
          alert("No se ha podido actualizar los strikes del usuario.");

        }
      });
  }

  crearEntidadEliminada(comentario: Comentario, idComentario: string, motivo: string) {
    const { id, ...comentarioSinId } = comentario;

    const entidad: EntElimPorAdm = {
      id: idComentario,
      idDuenio: comentario.idCreador,
      tipo: 'comentario',
      motivo: motivo,
      entidadElim: comentarioSinId
    };

    this.entElimPorAdmService.postEntElimPorAdm(entidad)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => console.log('Entidad eliminada guardada'),
        error: (err) => {
          console.error('Error al guardar entidad:', err);
          alert('Error al guardar registro de eliminación.');
        }
      });
  }

  notificarEliminacion(idCreador: string, idDestinatario: string, motivo: string, idCom: string) {

    if(idCreador){
      this.notificarUsuario(
        idCreador,
        `El administrador ${this.usuAdm.nombreCompleto} eliminó un comentario realizado por usted. Motivo: "${motivo}".`,
        idCom
      );
    }

    if (idDestinatario) {
      this.notificarUsuario(
        idDestinatario,
        `El administrador ${this.usuAdm.nombreCompleto} eliminó un comentario que recibiste por violar las normas del sitio.`,
        idCom
      );
    }
  }

  notificarAprobacion(idCreador: string, idDestinatario: string, idCom: string) {

    if(idCreador){
      this.notificarUsuario(
        idCreador,
        `El administrador ${this.usuAdm.nombreCompleto} controló y aprobó el comentario realizado por usted a ${this.getUsuarioProfesionalById(idDestinatario)?.nombreCompleto}, que habia sido reportado`,
        idCom
      );
    }

    if (idDestinatario) {
      this.notificarUsuario(
        idDestinatario,
        `El administrador ${this.usuAdm.nombreCompleto} controló y aprobó el comentario realizado por ${this.getUsuarioContratadorById(idDestinatario)?.nombreCompleto}, el cual usted habia reportado.`,
        idCom
      );
    }
  }


  notificarUsuario(idUsuario: string, mensaje: string, idEnt: string) {
    this.listNotService.getListaNotificacionesPorIDUsuario(idUsuario)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (listas) => {
        if (listas.length === 0) return;

        const lista = listas[0];
        const notif: Notificacion = {
          idEnt: idEnt,
          descripcion: mensaje,
          leido: false
        };

        lista.notificaciones.push(notif);
        this.actualizarListaNotificacion(lista);
      },
      error: (err) => console.error('Error notificando usuario:', idUsuario, err)
    });
  }

  actualizarListaNotificacion(lista: ListaNotificaciones) {
    if (!lista.id) return;

    this.listNotService.putListaNotificaciones(lista, lista.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }



  irAPerfilProfesional(idProfesional: string) {
    this.router.navigate(['admin/admprofperfil', idProfesional]);
  }

  irAPerfilContratador(idContratador: string) {
    this.router.navigate(['admin/perfAdmCont', idContratador]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrlsPerfil.forEach(url => URL.revokeObjectURL(url));
    this.objectUrlsPerfil = [];
    this.imagenesPerfil = {};
  }
}
