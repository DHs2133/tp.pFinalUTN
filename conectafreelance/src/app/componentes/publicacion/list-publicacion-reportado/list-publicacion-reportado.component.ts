import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Publicacion } from '../interfacePublicacion/publicacion.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { PublicacionService } from '../servicePublicacion/publicacion.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-publicacion-reportado',
  templateUrl: './list-publicacion-reportado.component.html',
  styleUrl: './list-publicacion-reportado.component.css'
})
export class ListPublicacionReportadoComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  publicacionesUsuario: Publicacion[] = [];
  imagenPublicacion: { [key: string]: SafeUrl } = {};
  imagenesPerfil: { [key: string]: SafeUrl } = {};
  usuariosProf: UsuarioProfesional[] = [];

  objectUrls: string[] = [];
  objectUrlsPerfil: string[] = [];

  publicacionService = inject(PublicacionService);
  profesionalService = inject(UsuarioProfesionalService);
  loginServ = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);

  ngOnInit(): void {
    this.getListaDePublicaciones();
  }

  getUsuarioProfesionalById(id: string): UsuarioProfesional | undefined {
    return this.usuariosProf.find(prof => prof.id === id);
  }

  getListaDePublicaciones() {
    this.publicacionService.getPublicacionesReportadas().pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        this.publicacionesUsuario = value || [];
        console.log('Publicaciones obtenidas:', this.publicacionesUsuario);
        this.publicacionesUsuario.forEach(pub => this.getUsuarioProfesional(pub.idCreador));
        this.obtenerImagenesDePublicacion();
      },
      error: (err) => {
        console.error('Error al obtener publicaciones:', err);
      }
    });
  }

  obtenerImagenesDePublicacion() {
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

  getUsuarioProfesional(idProfesional: string) {
    this.profesionalService.getUsuariosProfesionalPorID(idProfesional).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        if (!this.usuariosProf.some(prof => prof.id === value.id)) {
          this.usuariosProf.push(value);
          this.obtenerImagenPerfilDelServidor(value);
        }
      },
      error: (err) => {
        console.error('Error al obtener usuario profesional:', err);
      }
    });
  }

  obtenerImagenPerfilDelServidor(usuProf: UsuarioProfesional) {
    if (usuProf.urlFoto) {
      const urlFoto = usuProf.urlFoto;
      this.imageService.getImagen(urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrlsPerfil.push(objectUrl);
          this.imagenesPerfil[usuProf.id!] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: (err) => {
          console.error(`Error al cargar la imagen del perfil ${urlFoto}:`, err);
        }
      });
    }
  }

  controlar(pubReportada: Publicacion, decision: "aprobar" | "eliminar") {
    if (decision === "aprobar"){

      const confirmacion = confirm('¿Estás seguro de que deseas aprobar la publicación?');
      if (!confirmacion) {
        console.log('La publicación ha sido aprobada.');
        return;
      }

      this.aprobado(pubReportada);
    } else {

      const confirmacion = confirm('¿Estás seguro de que deseas eliminar la publicación?');
      if (!confirmacion) {
        console.log('La eliminación de la publicación ha sido cancelada.');
        return;
      }
      this.eliminar(pubReportada);
    }

    this.publicacionesUsuario = this.publicacionesUsuario.filter(pub => pub.id !== pubReportada.id);

  }

  aprobado(pubReportada: Publicacion) {
    pubReportada.controlado = true;
    pubReportada.reportada = false;
    if (pubReportada.id) {
      this.publicacionService.putPublicacion(pubReportada, pubReportada.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (value) => {
          alert("Publicación aprobada.");
        },
        error: (err) => {
          alert("No se ha podido aprobar la publicación.");
          console.log("Error: " + err);
        }
      });
    }
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

  irAPerfilProfesional(idProfesional: string) {
    this.router.navigate(['/perfil-profesional', idProfesional]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrlsPerfil.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.objectUrlsPerfil = [];
    this.imagenPublicacion = {};
    this.imagenesPerfil = {};
  }
}
