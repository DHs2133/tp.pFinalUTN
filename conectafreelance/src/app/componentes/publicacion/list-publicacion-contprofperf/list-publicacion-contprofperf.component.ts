import { Component, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Publicacion } from '../interfacePublicacion/publicacion.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { PublicacionService } from '../servicePublicacion/publicacion.service';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';

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
  imagenPerfil!:  SafeUrl;
  usuarioProfesional!: UsuarioProfesional;


  publicacionService = inject(PublicacionService);
  profesionalService = inject(UsuarioProfesionalService)
  loginServ = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);


  ngOnInit(): void {
    this.obtenerIdCreador();
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

































  reportarPublicacion(idPublicacion: string | undefined) {
    if (!idPublicacion) {
      console.error('ID de publicación no proporcionado');
      alert('Error. No se ha podido reportar la publicación');
      return;
    }

    const publicacion = this.publicacionesUsuario.find(p => p.id === idPublicacion);
    if (!publicacion) {
      console.error(`No se encontró la publicación con ID: ${idPublicacion}`);
      alert('Publicación no encontrada');
      return;
    }

    const confirmacion = confirm('¿Estás seguro de que deseas reportar esta publicación?');
    if (!confirmacion) {
      console.log('Reporte cancelado por el usuario');
      return;
    }

    const updatedPublicacion = { ...publicacion, reportada: true };
    console.log('Enviando actualización:', updatedPublicacion);

    this.publicacionService.putPublicacion(updatedPublicacion, idPublicacion).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          publicacion.reportada = true;
          alert('Publicación reportada');
        },
        error: (err) => {
          console.error('Error al reportar la publicación:', err);
          alert('No se pudo reportar la publicación:');
        }
      });
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imagenPublicacion = {};
  }


}
