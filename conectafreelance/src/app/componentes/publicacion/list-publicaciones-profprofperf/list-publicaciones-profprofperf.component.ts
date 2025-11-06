import { Component, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Publicacion } from '../interfacePublicacion/publicacion.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { PublicacionService } from '../servicePublicacion/publicacion.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-list-publicaciones-profprofperf',
  imports: [],
  templateUrl: './list-publicaciones-profprofperf.component.html',
  styleUrl: './list-publicaciones-profprofperf.component.css'
})
export class ListPublicacionesProfprofperfComponent {

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


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imagenPublicacion = {};
  }


}
