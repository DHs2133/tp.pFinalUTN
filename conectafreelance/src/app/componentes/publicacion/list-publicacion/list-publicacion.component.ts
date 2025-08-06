import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Publicacion } from '../interfacePublicacion/publicacion.interface';
import { PublicacionService } from '../servicePublicacion/publicacion.service';
import { ImageService } from '../../../service/back-end/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../../utils/service/login-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-publicacion',
  imports: [RouterModule, CommonModule],
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
  private objectUrls: string[] = [];

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

    if (publicacion.fotoCreador) {
      const fotoCreador = publicacion.fotoCreador;
      this.imageService.getImagen(fotoCreador).pipe(takeUntil(this.destroy$)).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrls.push(objectUrl);
          this.imagenPerfilPublicacion[fotoCreador] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: (err) => {
          console.error(`Error al cargar la imagen de perfil ${fotoCreador}:`, err);
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
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imagenPublicacion = {};
    this.imagenPerfilPublicacion = {};
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
