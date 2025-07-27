import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Publicacion } from '../interfacePublicacion/publicacion.interface';
import { PublicacionService } from '../servicePublicacion/publicacion.service';
import { ImageService } from '../../../service/back-end/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../../utils/service/login-service.service';

@Component({
  selector: 'app-list-publicacion',
  imports: [RouterModule],
  templateUrl: './list-publicacion.component.html',
  styleUrl: './list-publicacion.component.css'
})
export class ListPublicacionComponent implements OnChanges, OnInit, OnDestroy {
  @Input()
  publicacionNva!: Publicacion;

  idCreador: string | null = null;
  destroy$ = new Subject<void>();
  publicacionesUsuario: Publicacion[] = [];
  imagenPublicacion: { [key: string]: SafeUrl } = {};
  imagenPerfilPublicacion: { [key: string]: SafeUrl } = {};

  publicacionService = inject(PublicacionService);
  loginServ = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);

  ngOnInit(): void {
    this.obtenerIdCreador();
  }

  obtenerIdCreador() {
    this.idCreador = this.loginServ.getId();
    if (!this.idCreador) {
      console.error('ID del creador no disponible');
      return;
    }
    this.getListaDePublicaciones();
  }

  getListaDePublicaciones() {
    if (this.idCreador) {
      this.publicacionService.getPublicacionesPorIDcreador(this.idCreador).pipe(takeUntil(this.destroy$)).subscribe({
        next: (value) => {
          this.publicacionesUsuario = value || [];
          console.log('Publicaciones obtenidas:', this.publicacionesUsuario);
          this.obtenerImagenes();
        },
        error: (err) => {
          console.error('Error al obtener publicaciones:', err);
        }
      });
    }
  }

  obtenerImagenes() {
    this.publicacionesUsuario.forEach((publicacion) => {
      this.obtenerImagenesDelServidor(publicacion);
    });
  }

obtenerImagenesDelServidor(publicacion: Publicacion) {
  // Cargar imagen de la publicación
  if (publicacion.urlFoto) {
    this.imageService.getImagen(publicacion.urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imagenPublicacion[publicacion.urlFoto!] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        console.error(`Error al cargar la imagen de la publicación ${publicacion.urlFoto}:`, err);
        // this.imagenPublicacion[publicacion.urlFoto!] = this.sanitizer.bypassSecurityTrustUrl('assets/images/default-publicacion.jpg');
      }
    });
  }

  // Cargar imagen de perfil
  if (publicacion.fotoCreador) {
    this.imageService.getImagen(publicacion.fotoCreador).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imagenPerfilPublicacion[publicacion.fotoCreador!] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        console.error(`Error al cargar la imagen de perfil ${publicacion.fotoCreador}:`, err);

        // this.imagenPerfilPublicacion[publicacion.fotoCreador!] = this.sanitizer.bypassSecurityTrustUrl('assets/images/default-perfil.jpg');
      }
    });
  }
}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['publicacionNva'] && changes['publicacionNva'].currentValue) {
      this.publicacionesUsuario.push(changes['publicacionNva'].currentValue);
      console.log('Nueva publicación agregada:', this.publicacionesUsuario);
      this.obtenerImagenesDelServidor(changes['publicacionNva'].currentValue);
    }
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    Object.values(this.imagenPublicacion).forEach((url) => {
      if (typeof url === 'string') {
        URL.revokeObjectURL(url);
      }
    });
  }

  eliminar(publicacion: Publicacion) {
    if (publicacion.id) {
      this.eliminarPublicacion(publicacion.id);

    }
    if (publicacion.urlFoto) {
      this.eliminarFoto(publicacion.urlFoto);
    }
  }

  eliminarPublicacion(idPublicacion: string) {
    this.publicacionService.eliminarPublicacion(idPublicacion).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        alert('Publicación eliminada.');
        this.publicacionesUsuario = this.publicacionesUsuario.filter(pub => pub.id !== idPublicacion);
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
}
