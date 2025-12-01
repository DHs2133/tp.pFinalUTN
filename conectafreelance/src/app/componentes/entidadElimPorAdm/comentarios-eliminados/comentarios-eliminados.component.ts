import { Component, inject } from '@angular/core';
import { EntElimPorAdm } from '../interfaceEntElimPorAdmin/int-ent-elim-por-adm';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioContratador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { catchError, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { ServEntElimPorAdmService } from '../serviceEntElimPorAdmin/serv-ent-elim-por-adm.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Comentario } from '../../comentario/interfaceComentario/interface-comentario';

@Component({
  selector: 'app-comentarios-eliminados',
  imports: [],
  templateUrl: './comentarios-eliminados.component.html',
  styleUrl: './comentarios-eliminados.component.css'
})
export class ComentariosEliminadosComponent {


  entidadEliminadaService = inject(ServEntElimPorAdmService);
  contratadorService = inject(UsuarioContratadorService);
  profesionalService = inject(UsuarioProfesionalService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  route = inject(ActivatedRoute);
  router = inject(Router);

  destroy$ = new Subject<void>();
  imgSrc: string = "avatar.jpg";
  comentariosEliminados: EntElimPorAdm[] = [];
  contratador: UsuarioContratador | null = null;
  imagenPerfilContratador: SafeUrl | null = null;
  profesionales: Map<string, UsuarioProfesional | null> = new Map();
  imagenesPerfil: Map<string, SafeUrl> = new Map();
  objectUrls: string[] = [];

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const idDuenio = params.get('id');
      if (idDuenio) {
        this.cargarDatos(idDuenio);
      } else {
        alert('No se encontró el ID del contratador');
        this.router.navigate(['/admin']);
      }
    });
  }

  cargarDatos(idContratador: string): void {
    forkJoin({
      eliminados: this.entidadEliminadaService.getEntElimPorAdmPorIDDuenio(idContratador),
      contratador: this.contratadorService.getUsuariosContratadoresPorId(idContratador)
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ eliminados, contratador }) => {
          this.comentariosEliminados = eliminados ?? [];
          this.contratador = contratador;

          if (contratador?.urlFoto) {
            this.cargarImagenPerfilContratador(contratador.urlFoto);
          }

          this.cargarProfesionalesYsusFotos();
        },
        error: (err) => {
          console.error('Error cargando datos iniciales', err);
          alert('Error al cargar la información');
        }
      });
  }

  cargarProfesionalesYsusFotos(): void {
    const idsProfesionales = [...new Set(
      this.comentariosEliminados
        .map(ent => (ent.entidadElim as Comentario).idDestinatario)
    )];

    if (idsProfesionales.length === 0) return;

    const requests = idsProfesionales.map(id =>
      this.profesionalService.getUsuariosProfesionalPorID(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe(profesionales => {
      profesionales.forEach((prof, index) => {
        const id = idsProfesionales[index];
        this.profesionales.set(id, prof);

        if (prof?.urlFoto) {
          this.cargarImagenPerfilProfesional(prof.urlFoto);
        }
      });
    });
  }

  cargarImagenPerfilContratador(url: string): void {
    this.imageService.getImagen(url).subscribe({
      next: (blob) => {
        const safeUrl = this.crearSafeUrl(blob);
        this.imagenPerfilContratador = safeUrl;
      },
      error: () => {
        this.imagenPerfilContratador = null;
      }
    });
  }

  cargarImagenPerfilProfesional(url: string): void {

    if (this.imagenesPerfil.has(url)) return;

    this.imageService.getImagen(url).subscribe({
      next: (blob) => {
        const safeUrl = this.crearSafeUrl(blob);
        this.imagenesPerfil.set(url, safeUrl);
      },
      error: () => {
        this.imagenesPerfil.delete(url);
      }
    });
  }

  crearSafeUrl(blob: Blob): SafeUrl {
    const url = URL.createObjectURL(blob);
    this.objectUrls.push(url);
    return this.sanitizer.bypassSecurityTrustUrl(url);
  }

  getProfesional(id: string): UsuarioProfesional | null {
    return this.profesionales.get(id) ?? null;
  }

  getFotoProfesional(urlFoto?: string): SafeUrl {
    if (!urlFoto) return this.imgSrc;
    return this.imagenesPerfil.get(urlFoto) || this.imgSrc;
  }

  getComentario(ent: EntElimPorAdm): Comentario {
    return ent.entidadElim as Comentario;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
  }

}
