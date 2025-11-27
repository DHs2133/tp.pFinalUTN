import { Component, inject } from '@angular/core';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { Publicacion } from '../interfacePublicacion/publicacion.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioAdministrador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { PublicacionService } from '../servicePublicacion/publicacion.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Notificacion, ListaNotificaciones } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { UsuarioAdministradorService } from '../../usuario/usuarioAdmin/service/usuario-administrador.service';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ServEntElimPorAdmService } from '../../entidadElimPorAdm/serviceEntElimPorAdmin/serv-ent-elim-por-adm.service';
import { noWhitespaceValidator } from '../../../utils/ValidadoresPersonalizados';
import { EntElimPorAdm } from '../../entidadElimPorAdm/interfaceEntElimPorAdmin/int-ent-elim-por-adm';

@Component({
  selector: 'app-list-publicaciones-admprofperf',
  imports: [ReactiveFormsModule],
  templateUrl: './list-publicaciones-admprofperf.component.html',
  styleUrl: './list-publicaciones-admprofperf.component.css'
})
export class ListPublicacionesAdmprofperfComponent {

  destroy$ = new Subject<void>();
  idAdmin: string | null = null;
  idCreadorPublic: string | null = null;

  publicacionesUsuario: Publicacion[] = [];
  imagenPublicacion: { [key: string]: SafeUrl } = {};
  objectUrls: string[] = [];
  imagenPerfil!: SafeUrl;
  usuarioProfesional!: UsuarioProfesional;
  usuAdm!: UsuarioAdministrador;

  motivoControls: { [publicacionId: string]: FormControl } = {};

  publicacionService = inject(PublicacionService);
  profesionalService = inject(UsuarioProfesionalService);
  loginServ = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  listaNotService = inject(NotificacionService);
  usuAdmService = inject(UsuarioAdministradorService);
  entElimPorAdmService = inject(ServEntElimPorAdmService);

  ngOnInit(): void {
    this.idAdmin = this.loginServ.getId();
    this.obtenerUsuarioAdministrador();
    this.obtenerIdCreador();
  }

  obtenerUsuarioAdministrador() {
    this.usuAdmService.getUsuariosAdministradoresPorID(this.idAdmin!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (admin) => this.usuAdm = admin,
        error: () => {
          alert('Error al obtener datos del administrador.');
          this.router.navigate(['admin/perfil']);
        }
      });
  }

  obtenerIdCreador() {
    this.activatedRoute.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (param) => {
          this.idCreadorPublic = param.get('id');
          if (this.idCreadorPublic) {
            this.getListaDePublicaciones();
            this.getUsuarioProfesional();
          }
        },
        error: (err) => {
          console.error("Error al obtener ID del creador:", err);
          alert("No se pudo obtener el ID del profesional.");
        }
      });
  }

  getListaDePublicaciones() {
    this.publicacionService.getPublicacionesPorIDcreador(this.idCreadorPublic!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
          this.publicacionesUsuario = value || [];
          this.inicializarFormularios();
          this.obtenerImagenesDePublicaciones();
        },
        error: () => alert("Error al cargar las publicaciones.")
      });
  }

  inicializarFormularios() {
    this.motivoControls = {};
    this.publicacionesUsuario.forEach(pub => {
      this.motivoControls[pub.id!] = new FormControl('', [
        Validators.required,
        Validators.minLength(50),
        Validators.maxLength(200),
        noWhitespaceValidator()
      ]);
    });
  }

  obtenerImagenesDePublicaciones() {
    this.publicacionesUsuario.forEach(pub => {
      if (pub.urlFoto) this.obtenerImagenPublicacion(pub.urlFoto);
    });
  }

  obtenerImagenPublicacion(urlFoto: string) {
    if (this.imagenPublicacion[urlFoto]) return;

    this.imageService.getImagen(urlFoto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrls.push(objectUrl);
          this.imagenPublicacion[urlFoto] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        }
      });
  }

  getUsuarioProfesional() {
    this.profesionalService.getUsuariosProfesionalPorID(this.idCreadorPublic!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
          this.usuarioProfesional = value;
          this.obtenerImagenPerfil();
        },
        error: () => alert("Error al cargar datos del profesional.")
      });
  }

  obtenerImagenPerfil() {
    if (this.usuarioProfesional.urlFoto) {
      this.imageService.getImagen(this.usuarioProfesional.urlFoto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (blob) => {
            const objectUrl = URL.createObjectURL(blob);
            this.imagenPerfil = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
          }
        });
    }
  }


  eliminarConMotivo(publicacion: Publicacion) {
    const control = this.motivoControls[publicacion.id!];
    if (control.invalid) {
      control.markAsTouched();
      return;
    }

    const motivo = control.value.trim();
    if (!confirm(`¿Eliminar publicación? Motivo: "${motivo}"`)) return;

    this.eliminarPublicacionCompleta(publicacion, motivo);
  }

  eliminarPublicacionCompleta(publicacion: Publicacion, motivo: string) {
    if (!publicacion.id) return;

    this.publicacionService.eliminarPublicacion(publicacion.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.crearEntidadEliminada(publicacion, motivo);
          this.publicacionesUsuario = this.publicacionesUsuario.filter(p => p.id !== publicacion.id);
          delete this.motivoControls[publicacion.id!];

          this.updateUsuarioProfesional(publicacion.id as string, motivo, publicacion.reportadaPor);
          alert('Publicación eliminada correctamente.');
        },
        error: () => alert("Error al eliminar la publicación.")
      });
  }

  crearEntidadEliminada(publicacion: Publicacion, motivo: string) {
    const { id, ...pubSinId } = publicacion;
    const entidad: EntElimPorAdm = {
      id: publicacion.id!,
      idDuenio: publicacion.idCreador,
      tipo: 'publicacion',
      motivo,
      entidadElim: pubSinId
    };

    this.entElimPorAdmService.postEntElimPorAdm(entidad)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  updateUsuarioProfesional(idPubliElim: string, motivo: string, reportadaPor: string | null | undefined) {
    this.usuarioProfesional.cantPubRep = (this.usuarioProfesional.cantPubRep || 0) + 1;
    const strike = this.usuarioProfesional.cantPubRep;

    if (strike >= 3) this.usuarioProfesional.activo = false;

    this.notificarUsuario(
      this.idCreadorPublic!,
      `El administrador ${this.usuAdm.nombreCompleto} eliminó una publicación tuya. Motivo: "${motivo}". Strike: ${strike}/3`,
      idPubliElim
    );

    if (reportadaPor) {
      this.notificarUsuario(
        reportadaPor,
        `El administrador ${this.usuAdm.nombreCompleto} eliminó una publicación que reportaste. Motivo: "${motivo}"`,
        idPubliElim
      );
    }

    this.profesionalService.putUsuariosProfesionales(this.usuarioProfesional, this.usuarioProfesional.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => alert("Strikes actualizados."),
        error: () => alert("Error al actualizar strikes.")
      });
  }


  aprobar(pubReportada: Publicacion) {
    const publicacionActualizada = {
      ...pubReportada,
      controlado: true,
      reportada: false,
    };

    this.publicacionService.putPublicacion(publicacionActualizada, publicacionActualizada.id!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          alert("Publicación aprobada correctamente.");

          const textoCorto = pubReportada.cont.substring(0, 50) + (pubReportada.cont.length > 50 ? '...' : '');

          this.notificarUsuario(
            pubReportada.idCreador!,
            `El administrador ${this.usuAdm.nombreCompleto} revisó y aprobó tu publicación: "${textoCorto}". Ya no está reportada.`,
            null
          );

          if (pubReportada.reportadaPor) {
            this.notificarUsuario(
              pubReportada.reportadaPor,
              `El administrador ${this.usuAdm.nombreCompleto} revisó la publicación que reportaste: "${textoCorto}" y decidió mantenerla.`,
              null
            );
          }

          this.publicacionesUsuario = this.publicacionesUsuario.map(p =>
            p.id === pubReportada.id ? publicacionActualizada : p
          );
        },
        error: () => alert("Error al aprobar la publicación.")
      });
  }


 notificarUsuario(idUsuario: string, mensaje: string, idEnt: string | null = null): void {
    this.listaNotService.getListaNotificacionesPorIDUsuario(idUsuario)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((listas) => {
          if (listas.length === 0) {
            throw new Error(`Lista de notificaciones no encontrada para usuario ${idUsuario}`);
          }
          const lista = listas[0];
          lista.notificaciones.push({
            idEnt,
            descripcion: mensaje,
            leido: false
          } as Notificacion);
          return this.listaNotService.putListaNotificaciones(lista, lista.id!);
        })
      )
      .subscribe({
        next: () => console.log(`Notificación enviada a ${idUsuario}`),
        error: (err) => console.error(`Error enviando notificación a ${idUsuario}:`, err)
      });
  }

  irAPerfilProfesional(id: string) {
    this.router.navigate(['admin/admprofperfil', id]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imagenPublicacion = {};
  }

}
