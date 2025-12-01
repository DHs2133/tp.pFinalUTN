import { Component, inject, OnInit } from '@angular/core';
import { ServEntElimPorAdmService } from '../serviceEntElimPorAdmin/serv-ent-elim-por-adm.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { EntElimPorAdm } from '../interfaceEntElimPorAdmin/int-ent-elim-por-adm';
import { Publicacion } from '../../publicacion/interfacePublicacion/publicacion.interface';

@Component({
  selector: 'app-publicaciones-eliminadas',
  imports: [],
  templateUrl: './publicaciones-eliminadas.component.html',
  styleUrl: './publicaciones-eliminadas.component.css'
})
export class PublicacionesEliminadasComponent implements OnInit{

  publicacionesEliminadas: EntElimPorAdm[] = [];
  imagenPublicacion: { [key: string]: SafeUrl | null } = {};
  imagenPerfil: SafeUrl | null = null;
  profesional: UsuarioProfesional | null = null;
  destroy$ = new Subject<void>();

  entidadEliminadaService = inject(ServEntElimPorAdmService);
  profesionalService = inject(UsuarioProfesionalService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  route = inject(ActivatedRoute);
  router = inject(Router);

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (params) => {
        const idDuenio = params.get('id');
        if (idDuenio) {
          this.cargarDatosIniciales(idDuenio);
        } else {
          alert('No se pudo obtener el ID del profesional');
          this.router.navigate(['admin/perfil']);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Error al leer los parámetros de la ruta');
      },
    });
  }

  cargarDatosIniciales(idDuenio: string): void {
    forkJoin({
      eliminadas: this.entidadEliminadaService.getEntElimPorAdmPorIDDuenio(idDuenio),
      profesional: this.profesionalService.getUsuariosProfesionalPorID(idDuenio),
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ eliminadas, profesional }) => {
          this.publicacionesEliminadas = eliminadas ?? [];
          this.profesional = profesional;

          if (profesional?.urlFoto) {
            this.cargarImagenPerfil(profesional.urlFoto);
          }

          this.cargarImagenesDePublicaciones();
        },
        error: (err) => {
          console.error('Error cargando datos iniciales:', err);
          alert('Error al cargar la información del profesional');
        },
      });
  }

  cargarImagenesDePublicaciones(): void {
    this.publicacionesEliminadas.forEach((entElim) => {
      const publicacion = entElim.entidadElim as Publicacion;

      if (!publicacion.urlFoto || this.imagenPublicacion[entElim.id!] !== undefined) {
        return;
      }

      this.imageService.getImagen(publicacion.urlFoto!).subscribe({
        next: (blob) => {
          const safeUrl = this.crearObjectUrl(blob);
          this.imagenPublicacion[entElim.id!] = safeUrl;
        },
        error: (err) => {
          console.error(`Error cargando imagen de publicación ${publicacion.id}`, err);
          this.imagenPublicacion[entElim.id!] = null;
        },
      });
    });
  }

  cargarImagenPerfil(urlFotoPerfil: string): void {
    this.imageService.getImagen(urlFotoPerfil).subscribe({
      next: (blob) => {
        this.imagenPerfil = this.crearObjectUrl(blob);
      },
      error: (err) => {
        console.error('Error cargando foto de perfil del profesional', err);
        this.imagenPerfil = null;
      },
    });
  }

  crearObjectUrl(blob: Blob): SafeUrl {
    const url = URL.createObjectURL(blob);
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    Object.values(this.imagenPublicacion).forEach((url) => {
      if (url && typeof url === 'string') {
        URL.revokeObjectURL(url);
      }
    });
    if (this.imagenPerfil && typeof this.imagenPerfil === 'string') {
      URL.revokeObjectURL(this.imagenPerfil as string);
    }
  }

  getPublicacion(entElim: EntElimPorAdm): Publicacion {
    return entElim.entidadElim as Publicacion;
  }

}
