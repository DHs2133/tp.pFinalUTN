import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { catchError, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { Publicacion } from '../interfacePublicacion/publicacion.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioAdministrador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { PublicacionService } from '../servicePublicacion/publicacion.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { noWhitespaceValidator } from '../../../utils/ValidadoresPersonalizados';
import { EntElimPorAdm } from '../../entidadElimPorAdm/interfaceEntElimPorAdmin/int-ent-elim-por-adm';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { UsuarioAdministradorService } from '../../usuario/usuarioAdmin/service/usuario-administrador.service';
import { ServEntElimPorAdmService } from '../../entidadElimPorAdm/serviceEntElimPorAdmin/serv-ent-elim-por-adm.service';

@Component({
  selector: 'app-list-publicacion-reportado',
  imports: [ReactiveFormsModule],
  templateUrl: './list-publicacion-reportado.component.html',
  styleUrl: './list-publicacion-reportado.component.css'
})
export class ListPublicacionReportadoComponent implements OnInit, OnDestroy {

  destroy$ = new Subject<void>();
  publicaciones: Publicacion[] = [];
  imagenPublicacion: { [key: string]: SafeUrl } = {};
  imagenesPerfil: { [key: string]: SafeUrl } = {};
  usuariosProf: UsuarioProfesional[] = [];

  // Mapa para formularios de motivo por publicación
  motivoControls: { [publicacionId: string]: FormControl } = {};

  // Admin
  usuAdm!: UsuarioAdministrador;
  idAdm: string = '';

  // Servicios
  publicacionService = inject(PublicacionService);
  profesionalService = inject(UsuarioProfesionalService);
  loginServ = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  listNotService = inject(NotificacionService);
  usuAdmService = inject(UsuarioAdministradorService);
  entElimPorAdmService = inject(ServEntElimPorAdmService);

  objectUrlsPublicacion: string[] = [];
  objectUrlsPerfil: string[] = [];

  ngOnInit(): void {
    this.idAdm = this.loginServ.getId();
    this.obtenerUsuarioAdministrador();
    this.getListaDePublicaciones();
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

  getListaDePublicaciones() {
    this.publicacionService.getPublicacionesReportadas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
          this.publicaciones = value || [];
          if (this.publicaciones.length > 0) {
            this.cargarDatosCreadores();
            this.inicializarFormularios();
            this.obtenerImagenesDePublicacion();
          }
        },
        error: (err) => {
          console.error('Error al obtener publicaciones reportadas:', err);
        }
      });
  }

  cargarDatosCreadores() {
    const idsCreadores = [...new Set(this.publicaciones.map(p => p.idCreador))];

    const requests = idsCreadores.map(id =>
      this.profesionalService.getUsuariosProfesionalPorID(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results) => {
        results.forEach((profesional) => {
          if (profesional) {
            this.usuariosProf.push(profesional);
            this.obtenerImagenPerfilDelServidor(profesional);
          }
        });
      }
    });
  }

  obtenerImagenPerfilDelServidor(profesional: UsuarioProfesional) {
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

  obtenerImagenesDePublicacion() {
    this.publicaciones.forEach((publicacion) => {
      if (publicacion.urlFoto) {
        this.obtenerImagenPublicacionDelServidor(publicacion);
      }
    });
  }

  obtenerImagenPublicacionDelServidor(publicacion: Publicacion) {
    if (!publicacion.urlFoto || this.imagenPublicacion[publicacion.id!]) return;

    this.imageService.getImagen(publicacion.urlFoto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrlsPublicacion.push(objectUrl);
          this.imagenPublicacion[publicacion.id!] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: () => {
          this.imagenPublicacion[publicacion.id!] = 'public/default-pub.jpg' as any;
        }
      });
  }

  getUsuarioProfesionalById(id: string): UsuarioProfesional | undefined {
    return this.usuariosProf.find(u => u.id === id);
  }

  inicializarFormularios() {
    this.motivoControls = {};
    this.publicaciones.forEach(pub => {
      this.motivoControls[pub.id!] = new FormControl('', [
        Validators.required,
        Validators.minLength(50),
        Validators.maxLength(200),
        noWhitespaceValidator()
      ]);
    });
  }

  controlar(pubReportada: Publicacion, decision: "aprobar" | "eliminar") {
    if (decision === "aprobar") {
      if (!confirm('¿Aprobar publicación reportada?')) return;
      this.aprobado(pubReportada);
      this.publicaciones = this.publicaciones.filter(p => p.id !== pubReportada.id);
      return;
    }

    const control = this.motivoControls[pubReportada.id!];
    if (!control || control.invalid) {
      control?.markAsTouched();
      return;
    }

    const motivo = control.value.trim();
    if (!confirm(`¿Eliminar publicación? Motivo: "${motivo}"`)) return;

    this.eliminarPublicacionCompleta(pubReportada, motivo);
  }

  aprobado(pubReportada: Publicacion) {
    pubReportada.controlado = true;
    pubReportada.reportada = false;
    const { reportadaPor, ...pubReportadaSinIDReportador } = pubReportada;


    if (pubReportadaSinIDReportador.id) {
      this.publicacionService.putPublicacion(pubReportadaSinIDReportador, pubReportadaSinIDReportador.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            alert("Publicación aprobada.");
            this.notificarAprobacionAProfesional(pubReportadaSinIDReportador);
            this.notificarAprobacionAContratador(pubReportada);
          },
          error: () => alert("Error al aprobar.")
        });
    }
  }

  eliminarPublicacionCompleta(publicacion: Publicacion, motivo: string) {
    if (!publicacion.id) return;

    const idPublicacion = publicacion.id;
    const idCreador = publicacion.idCreador;
    const idContratador = publicacion.reportadaPor;

    this.publicacionService.eliminarPublicacion(idPublicacion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {


          this.crearEntidadEliminada(publicacion, idPublicacion, motivo);
          this.publicaciones = this.publicaciones.filter(p => p.id !== idPublicacion);
          delete this.motivoControls[idPublicacion];
          this.updateUsuarioProfesional(idCreador);
          this.notificarEliminacionAProfesional(idCreador, motivo, idPublicacion);
          this.notificarEliminacionAContratador(idContratador as string, motivo, idPublicacion);

          alert('Publicación eliminada correctamente.');
        },
        error: (err) => {
          console.error('Error al eliminar:', err);
          alert('No se pudo eliminar la publicación.');
        }
      });
  }

  crearEntidadEliminada(publicacion: Publicacion, idPublicacion: string, motivo: string) {
    const { id, ...publicacionSinId } = publicacion;

    const entidad: EntElimPorAdm = {
      id: idPublicacion,
      idDuenio: publicacion.idCreador,
      tipo: 'publicacion',
      motivo: motivo,
      entidadElim: publicacionSinId
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

  updateUsuarioProfesional(idCreador: string) {
    let usuarioProfesional = this.usuariosProf.find(up => up.id === idCreador)!;


    const strike = (usuarioProfesional.cantPubRep || 0) + 1;

    if (strike >= 3) {
      usuarioProfesional.activo = false;
    }

    usuarioProfesional.cantPubRep = strike;

    this.profesionalService.putUsuariosProfesionales(usuarioProfesional, usuarioProfesional.id!)
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

  notificarEliminacionAProfesional(idCreador: string, motivo: string, idPub: string) {
    if (idCreador) {
      this.notificarUsuario(
        idCreador,
        `El administrador ${this.usuAdm.nombreCompleto} eliminó una publicación realizada por usted. Motivo: "${motivo}".`,
        idPub
      );
    }
  }

  notificarEliminacionAContratador(idContratador: string, motivo: string, idPub: string) {
    if (idContratador) {
      this.notificarUsuario(
        idContratador,
        `El administrador ${this.usuAdm.nombreCompleto} eliminó una publicación reportada por usted. Motivo: "${motivo}".`,
        idPub
      );
    }
  }

  notificarAprobacionAProfesional(publicacion: Publicacion) {

    if (publicacion.idCreador) {
      this.notificarUsuario(
        publicacion.idCreador,
        `El administrador ${this.usuAdm.nombreCompleto} controló y aprobó la publicación suya "${publicacion.cont.substring(0, 50)}... ", que había sido reportada.`,
        null
      );
    }
  }

  notificarAprobacionAContratador(publicacion: Publicacion) {

    if (publicacion.idCreador && publicacion.reportadaPor) {
      this.notificarUsuario(
        publicacion.reportadaPor,
        `El administrador ${this.usuAdm.nombreCompleto} controló y aprobó la publicación "${publicacion.cont.substring(0, 50)}... ", que había sido reportada por usted.`,
        null
      );
    }
  }

  notificarUsuario(idUsuario: string, mensaje: string, idEnt: string | null | undefined) {
    this.listNotService.getListaNotificacionesPorIDUsuario(idUsuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (listas) => {
          if (listas.length === 0) return;

            const lista = listas[0];
            if(idEnt){
              const notif: Notificacion = {
                idEnt: idEnt,
                descripcion: mensaje,
                leido: false
              };
              lista.notificaciones.push(notif);

            }else{
              const notif: Notificacion = {
                descripcion: mensaje,
                leido: false

              };
              lista.notificaciones.push(notif);

            }

          this.actualizarListaNotificacion(lista);
        },
        error: (err) => console.error('Error notificando usuario:', idUsuario, err)
      });
  }

  actualizarListaNotificacion(lista: ListaNotificaciones) {
    if (!lista.id) return;

    this.listNotService.putListaNotificaciones(lista, lista.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next : (value) => {
          console.log("Usuario notificado");

        },
        error: (err) =>{
          console.error("Err: " + err);
          alert("Error. No se ha podido notificar a todos los usuarios");

        }
      });
  }

  irAPerfilProfesional(idProfesional: string) {
    this.router.navigate(['admin/admprofperfil', idProfesional]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.objectUrlsPublicacion.forEach(url => URL.revokeObjectURL(url));
    this.objectUrlsPerfil.forEach(url => URL.revokeObjectURL(url));

    this.objectUrlsPublicacion = [];
    this.objectUrlsPerfil = [];
    this.imagenPublicacion = {};
    this.imagenesPerfil = {};
  }
}
