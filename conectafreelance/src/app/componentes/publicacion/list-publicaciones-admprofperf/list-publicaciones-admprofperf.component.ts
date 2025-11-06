import { Component, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
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

@Component({
  selector: 'app-list-publicaciones-admprofperf',
  imports: [],
  templateUrl: './list-publicaciones-admprofperf.component.html',
  styleUrl: './list-publicaciones-admprofperf.component.css'
})
export class ListPublicacionesAdmprofperfComponent {

  idAdmin: string|null = null;
  idCreadorPublic: string | null = null;
  destroy$ = new Subject<void>();
  publicacionesUsuario: Publicacion[] = [];
  imagenPublicacion: { [key: string]: SafeUrl } = {};
  objectUrls: string[] = [];
  imagenPerfil!:  SafeUrl;
  usuarioProfesional!: UsuarioProfesional;
  notificacionNva: Notificacion ={
    descripcion: "",
    leido: false
  }
  listaNotificaciones!: ListaNotificaciones;
  usuAdm!: UsuarioAdministrador;


  publicacionService = inject(PublicacionService);
  profesionalService = inject(UsuarioProfesionalService)
  loginServ = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  listaNotService = inject(NotificacionService);
  usuAdmService = inject(UsuarioAdministradorService);


  ngOnInit(): void {

    this.idAdmin = this.loginServ.getId();
    this.obtenerUsuarioAdministradorBDD(this.idAdmin);
    this.obtenerIdCreador();
  }

  obtenerUsuarioAdministradorBDD(idAdm: string){

    this.usuAdmService.getUsuariosAdministradoresPorID(idAdm).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        this.usuAdm = value;
      },
      error : (err) => {
        alert("Ha ocurrido un error al intentar obtener al usuario administrador.");
        console.error("Error: " + err);
      },
    })
  }

  obtenerIdCreador() {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next : (param) => {
        this.idCreadorPublic = param.get("id");
      },
      error : (err) => {
        alert("Ha ocurrido un error.");
        console.log("Error: " + err);
      },

    });

    this.getListaDePublicaciones();
    this.getUsuarioProfesional()
  }

  getListaDePublicaciones() {
    if (this.idCreadorPublic) {
      this.publicacionService.getPublicacionesPorIDcreador(this.idCreadorPublic).pipe(takeUntil(this.destroy$)).subscribe({
        next: (value) => {
          this.publicacionesUsuario = value || [];
          console.log('Publicaciones obtenidas:', this.publicacionesUsuario);
          this.obtenerImagenesDePublicaciones();
        },
        error: (err) => {
          console.error('Error al obtener publicaciones:', err);
        }
      });
    }
  }

  obtenerImagenesDePublicaciones() {
    this.publicacionesUsuario.forEach((publicacion) => {
      this.obtenerImagenesPublicacionDelServidor(publicacion);
    });
  }

  obtenerImagenesPublicacionDelServidor(publicacion: Publicacion) {
    if (publicacion.urlFoto) {
      const urlFoto = publicacion.urlFoto;
      this.imageService.getImagen(urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrls.push(objectUrl);
          this.imagenPublicacion[urlFoto] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: (err) => {
          console.error(`Error al cargar la imagen de la publicación ${urlFoto}:`, err);
        }
      });
    }
  }


  getUsuarioProfesional(){

    if (this.idCreadorPublic) {
      this.profesionalService.getUsuariosProfesionalPorID(this.idCreadorPublic).pipe(takeUntil(this.destroy$)).subscribe({
        next: (value) => {
          this.usuarioProfesional = value;
          console.log('Usuario:', this.usuarioProfesional);
          this.obtenerImagenPerfilDelServidor(this.usuarioProfesional);
          this.getListaNotificaciones();
        },
        error: (err) => {
          console.error('Error al obtener publicaciones:', err);
        }
      });
    }

  }


  obtenerImagenPerfilDelServidor(usuProf: UsuarioProfesional) {
    if (usuProf.urlFoto) {
      const urlFoto = usuProf.urlFoto;
      this.imageService.getImagen(urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.imagenPerfil = this.sanitizer.bypassSecurityTrustUrl(objectUrl);

        },
        error: (err) => {
          console.error(`Error al cargar la imagen de la publicación ${urlFoto}:`, err);
        }
      });
    }
  }

  getListaNotificaciones(){

    this.listaNotService.getListaNotificacionesPorIDUsuario(this.idCreadorPublic as string).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        if(value.length > 0){
          this.listaNotificaciones = value[0]
        }
      },
      error : (err) => {
        alert("Ha ocurrido el error al obtener la lista del notificaciones del usuario profesional. Será redirigido a su perfil");
        this.router.navigate(['administrador/perfil']);
      },
    })
  }




























  eliminar(publicacion: Publicacion) {

    const confirmacion = confirm('¿Estás seguro de que deseas eliminar esta publicación?');
    if (!confirmacion) {
      console.log('Eliminacion cancelada');
      return;

    }else{

      if (publicacion.id) {
        this.eliminarPublicacion(publicacion.id);
      }else {
        console.error('ID de publicación no proporcionado');
        alert('Error. No se ha podido eliminar la publicación');
        return;
      }

    }

  }



  eliminarPublicacion(idPublicacion: string) {


    const publicacion = this.publicacionesUsuario.find(p => p.id === idPublicacion);
    if (!publicacion) {
      console.error(`No se encontró la publicación con ID: ${idPublicacion}`);
      alert('Publicación no encontrada');
      return;
    }

    if (publicacion.urlFoto) {
      this.eliminarFoto(publicacion.urlFoto);
    }

    this.eliminarPublicacionDeBDD(idPublicacion);
  }

  eliminarPublicacionDeBDD(idPublicacion: string) {
    this.publicacionService.eliminarPublicacion(idPublicacion).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        alert('Publicación eliminada.');
        this.publicacionesUsuario = this.publicacionesUsuario.filter(pub => pub.id !== idPublicacion);
        this.updateUsuarioProfesional(idPublicacion);
      },
      error: (err) => {
        alert('No se pudo eliminar la publicación.');
        console.error(err);
      }
    });
  }

  eliminarFoto(nombreFoto: string) {
    this.imageService.deleteImage(nombreFoto).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        console.log('Foto eliminada correctamente');
      },
      error: (err) => {
        console.error('No se pudo borrar la foto:', err);
      }
    });
  }


  updateUsuarioProfesional(idPubliElim: string){
    this.usuarioProfesional.cantPubRep = this.usuarioProfesional.cantPubRep + 1;

    if(this.usuarioProfesional.cantPubRep === 3){
      this.usuarioProfesional.activo = false;
    }else{
      this.generarNotificacion(idPubliElim, this.usuarioProfesional.cantPubRep);

    }

    this.profesionalService.putUsuariosProfesionales(this.usuarioProfesional, this.usuarioProfesional.id as string).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        alert("Informacion del usuario actualizada");
      },
      error : (err) => {
        alert("Ha ocurrido un error al actualizar la información del usuario profesional.");
        console.error("Err: " + err);
      },
    })

  }


  generarNotificacion(idPubliElim: string, strike: number){

    const notificacionNva = {
      idOriginador: this.idAdmin as string,
      idEntRep: idPubliElim,
      descripcion: `Una publicación suya fue eliminada por un administrador. Strike: ${strike}/3`,
      leido: false
    }

    this.listaNotificaciones.notificaciones.push(notificacionNva);
    this.guardarNotificacion(this.listaNotificaciones);

  }


  guardarNotificacion(listaNot: ListaNotificaciones){
    this.listaNotService.putListaNotificaciones(listaNot, listaNot.id as string).pipe(takeUntil(this.destroy$)).subscribe({
      next : (valor) =>{
        alert("Notificacion enviada al usuario.");
      },
      error : (err) => {
        alert("No se pudo notificar al usuario.");
        console.error("Err: " + err);
      },
    })
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imagenPublicacion = {};
  }


}
