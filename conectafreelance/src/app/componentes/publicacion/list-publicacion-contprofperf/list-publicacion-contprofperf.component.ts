import { Component, inject } from '@angular/core';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { Publicacion } from '../interfacePublicacion/publicacion.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { PublicacionService } from '../servicePublicacion/publicacion.service';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioAdministrador, UsuarioContratador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { UsuarioAdministradorService } from '../../usuario/usuarioAdmin/service/usuario-administrador.service';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';

@Component({
  selector: 'app-list-publicacion-contprofperf',
  imports: [],
  templateUrl: './list-publicacion-contprofperf.component.html',
  styleUrl: './list-publicacion-contprofperf.component.css'
})
export class ListPublicacionContprofperfComponent {


  idCreadorPublic: string | null = null;
  destroy$ = new Subject<void>();
  publicacionesUsuario: Publicacion[] = [];
  imagenPublicacion: { [key: string]: SafeUrl } = {};
  objectUrls: string[] = [];
  imagenPerfil!: SafeUrl;
  usuarioProfesional!: UsuarioProfesional;
  usuarioReportador!: UsuarioContratador;
  administradores: UsuarioAdministrador[] = [];

  // Servicios
  publicacionService = inject(PublicacionService);
  profesionalService = inject(UsuarioProfesionalService);
  contratadorService = inject(UsuarioContratadorService);
  loginServ = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  notifService = inject(NotificacionService);
  adminService = inject(UsuarioAdministradorService);

  ngOnInit(): void {
    this.obtenerIdCreador();
  }

  obtenerIdCreador() {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idCreadorPublic = param.get("id");
        if (this.idCreadorPublic) {
          this.cargarDatosIniciales();
        }
      },
      error: (err) => {
        alert("Error al obtener el ID del profesional.");
        console.error(err);
      }
    });
  }

  cargarDatosIniciales() {
    const idSesion = this.loginServ.getId();

    forkJoin({
      publicaciones: this.publicacionService.getPublicacionesPorIDcreador(this.idCreadorPublic!),
      profesional: this.profesionalService.getUsuariosProfesionalPorID(this.idCreadorPublic!),
      reportador: this.contratadorService.getUsuariosContratadoresPorId(idSesion),
      administradores: this.adminService.getUsuariosAdministradores()
    })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ publicaciones, profesional, reportador, administradores }) => {
        this.publicacionesUsuario = publicaciones || [];
        this.usuarioProfesional = profesional;
        this.usuarioReportador = reportador;
        this.administradores = administradores;

        this.obtenerImagenesDePublicaciones(publicaciones);
        this.obtenerImagenPerfilDelServidor(profesional);
      },
      error: (err) => {
        console.error('Error cargando datos iniciales:', err);
        alert('Error al cargar la información.');
      }
    });
  }

  obtenerImagenesDePublicaciones(publicaciones: Publicacion[]) {
    this.publicacionesUsuario.forEach(pub => {
      if (pub.urlFoto && pub.id && !this.imagenPublicacion[pub.id]) {
        this.obtenerImagenPublicacionDelServidor(pub);
      }
    });
  }

  obtenerImagenPublicacionDelServidor(publicacion: Publicacion) {
    this.imageService.getImagen(publicacion.urlFoto!)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrls.push(objectUrl);
          this.imagenPublicacion[publicacion.id!] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: (err) => {
          console.error(`Error cargando imagen: ${publicacion.urlFoto}`, err);
        }
      });
  }

  obtenerImagenPerfilDelServidor(usuProf: UsuarioProfesional) {
    if (!usuProf.urlFoto) return;

    this.imageService.getImagen(usuProf.urlFoto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.imagenPerfil = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: (err) => {
          console.error(`Error cargando foto de perfil: ${usuProf.urlFoto}`, err);
        }
      });
  }

  reportarPublicacion(idPublicacion: string | undefined) {
    if (!idPublicacion) {
      alert('Error: Publicación no válida.');
      return;
    }

    const publicacion = this.publicacionesUsuario.find(p => p.id === idPublicacion);
    if (!publicacion) {
      alert('Publicación no encontrada.');
      return;
    }

    if (publicacion.reportada) {
      alert('Esta publicación ya fue reportada.');
      return;
    }

    if (!confirm('¿Reportar esta publicación?')) return;

    const idSesion = this.loginServ.getId();
    const updatedPub = { ...publicacion, reportada: true, reportadaPor: idSesion};

    this.publicacionService.putPublicacion(updatedPub, idPublicacion)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          publicacion.reportada = true;
          alert('Publicación reportada correctamente.');

          this.notificarProfesional(publicacion);
          this.notificarAdministradores(publicacion);
        },
        error: (err) => {
          console.error('Error al reportar:', err);
          alert('No se pudo reportar la publicación.');
        }
      });
  }

  notificarProfesional(publicacion: Publicacion) {
    const mensaje = `Tu publicación "${publicacion.cont.substring(0, 50)}..." ha sido reportada por un usuario.`;
    this.enviarNotificacion(publicacion.idCreador, mensaje);
  }

  notificarAdministradores(publicacion: Publicacion) {
    if (!this.usuarioReportador || this.administradores.length === 0) return;

    const nombreReportador = this.usuarioReportador.nombreCompleto || 'Un usuario';
    const mensaje = `${nombreReportador} reportó una publicación del profesional ${this.usuarioProfesional.nombreCompleto}.`;

    this.administradores
      .filter(admin => ['p', 'cp'].includes(admin.permisos))
      .forEach(admin => this.enviarNotificacion(admin.id!, mensaje));
  }

  enviarNotificacion(idUsuario: string, mensaje: string) {
    this.notifService.getListaNotificacionesPorIDUsuario(idUsuario)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (listas) => {
          if (listas.length === 0) return;

          const lista = listas[0];
          const notif: Notificacion = {
            descripcion: mensaje,
            leido: false
          };

          lista.notificaciones.push(notif);
          this.actualizarListaNotificacion(lista);
        },
        error: (err) => {
          console.error(`Error notificando a ${idUsuario}:`, err);
        }
      });
  }

  actualizarListaNotificacion(lista: ListaNotificaciones) {
    if (!lista.id) return;

    this.notifService.putListaNotificaciones(lista, lista.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imagenPublicacion = {};
  }
}
