import { Component, inject } from '@angular/core';
import { UsuarioContratador, UsuarioProfesional } from '../../../usuario/interfaceUsuario/usuario.interface';
import { UsuarioProfesionalService } from '../../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { UsuarioContratadorService } from '../../../usuario/usuarioContratador/service/usuario-contratador.service';
import { LoginService } from '../../../../utils/service/login-service.service';
import { catchError, EMPTY, filter, forkJoin, map, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { Comentario } from '../../../comentario/interfaceComentario/interface-comentario';
import { Publicacion } from '../../../publicacion/interfacePublicacion/publicacion.interface';
import { ServEntElimPorAdmService } from '../../serviceEntElimPorAdmin/serv-ent-elim-por-adm.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageService } from '../../../../service/back-end/image.service';
import { EntElimPorAdm } from '../../interfaceEntElimPorAdmin/int-ent-elim-por-adm';

@Component({
  selector: 'app-mostrar-ent-elim-por-adm',
  imports: [],
  templateUrl: './mostrar-ent-elim-por-adm.component.html',
  styleUrl: './mostrar-ent-elim-por-adm.component.css'
})
export class MostrarEntElimPorAdmComponent {

  destroy$ = new Subject<void>();

  route = inject(ActivatedRoute);
  router = inject(Router);
  login = inject(LoginService);
  entidadesService = inject(ServEntElimPorAdmService);
  usuarioProfService = inject(UsuarioProfesionalService);
  usuarioContService = inject(UsuarioContratadorService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);

  idSesion = this.login.getId();
  rol = this.login.getRol();

  esPublicacion = true;
  entidad: EntElimPorAdm | null = null;
  publicacion: Publicacion | null = null;
  comentario: Comentario | null = null;
  usuarioProfesional: UsuarioProfesional | null = null;
  usuarioContratador: UsuarioContratador | null = null;

  imgPerfilProfesional: SafeUrl | null = null;
  imgPerfilContratador: SafeUrl | null= null;
  imgPublicacion: SafeUrl | null = null;

  ngOnInit(): void {
    if (!this.idSesion || !this.rol) {
      this.irAPerfil();
      return;
    }

    this.cargarEntidadDesdeRuta();
  }

  cargarEntidadDesdeRuta(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const idEntidad = params.get('idEntElim');
        if (!idEntidad) {
          this.mostrarError('ID de entidad no encontrado en la ruta.');
          this.irAPerfil();
          return of(null);
        }
        return this.entidadesService.getEntElimPorAdmPorID(idEntidad);
      }),
      catchError(err => {
        console.error('Error al obtener entidad:', err);
        this.mostrarError('No se pudo cargar la entidad eliminada.');
        this.irAPerfil();
        return of(null);
      }),
      takeUntil(this.destroy$)
    ).subscribe(entidad => {
      if (entidad) {
        this.procesarEntidad(entidad);
      }
    });
  }

  procesarEntidad(entidad: EntElimPorAdm): void {
    this.entidad = entidad;

    if (entidad.tipo === 'publicacion') {
      this.esPublicacion = true;
      this.publicacion = entidad.entidadElim as Publicacion;
      this.cargarDatosPublicacion(this.publicacion);
    } else if (entidad.tipo === 'comentario') {
      this.esPublicacion = false;
      this.comentario = entidad.entidadElim as Comentario;
      this.cargarDatosComentario(this.comentario);
    } else {
      this.mostrarError('Tipo de entidad desconocido.');
      this.irAPerfil();
    }
  }

  cargarDatosPublicacion(pub: Publicacion): void {
    this.publicacion = pub;

    this.cargarUsuarioProfesional(pub.idCreador).subscribe(prof => {
      this.usuarioProfesional = prof;

      if (prof?.urlFoto) {
        this.imageService.getImagen(prof.urlFoto).subscribe(blob => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            this.imgPerfilProfesional = this.sanitizer.bypassSecurityTrustUrl(url);
          }
        });
      }
    });

    if (pub.urlFoto) {
      this.imageService.getImagen(pub.urlFoto).subscribe({
        next: (blob) => {
          if (blob && blob.size > 0) {
            const url = URL.createObjectURL(blob);
            this.imgPublicacion = this.sanitizer.bypassSecurityTrustUrl(url);
          }
        },
        error: (err) => {
          console.error('Error cargando imagen de publicación eliminada:', err);
          this.imgPublicacion = null;
        }
      });
    }
  }

  /*
  cargarDatosPublicacion(pub: Publicacion): void {
    forkJoin({
      profesional: this.cargarUsuarioProfesional(pub.idCreador),
      imgPublicacion: pub.urlFoto ? this.cargarImagen(pub.urlFoto) : of(null),
      imgPerfil: this.cargarImagenPerfilProfesional(pub.idCreador)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ profesional, imgPublicacion, imgPerfil }) => {
        this.usuarioProfesional = profesional;
        this.imgPublicacion = imgPublicacion;
        this.imgPerfilProfesional = imgPerfil;
      },
      error: () => this.mostrarError('Error al cargar datos de la publicación.')
    });
  }
  */

  cargarDatosComentario(com: Comentario): void {
    forkJoin({
      contratador: this.cargarUsuarioContratador(com.idCreador),
      profesional: this.cargarUsuarioProfesional(com.idDestinatario),
      imgPerfilContratador: this.cargarImagenPerfilContratador(com.idCreador),
      imgPerfilProfesional: this.cargarImagenPerfilProfesional(com.idDestinatario)
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: ({ contratador, profesional, imgPerfilContratador, imgPerfilProfesional }) => {
        this.usuarioContratador = contratador;
        this.usuarioProfesional = profesional;
        this.imgPerfilContratador = imgPerfilContratador;
        this.imgPerfilProfesional = imgPerfilProfesional;
      },
      error: () => this.mostrarError('Error al cargar datos del comentario.')
    });
  }

  cargarUsuarioProfesional(id: string) {
    return this.usuarioProfService.getUsuariosProfesionalPorID(id).pipe(
      catchError(err => {
        console.error('Error cargando profesional:', err);
        return of(null);
      })
    );
  }

  cargarUsuarioContratador(id: string) {
    return this.usuarioContService.getUsuariosContratadoresPorId(id).pipe(
      catchError(err => {
        console.error('Error cargando contratador:', err);
        return of(null);
      })
    );
  }

  cargarImagen(fileName: string) {
    return this.imageService.getImagen(fileName).pipe(
      switchMap(blob => of(this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob)))),
      catchError(err => {
        console.error('Error cargando imagen:', fileName, err);
        return of(null);
      })
    );
  }

  // Siempre existe foto de perfil, por ende hago retornar observable con imagen
  cargarImagenPerfilProfesional(idUsuario: string) {
    return this.cargarUsuarioProfesional(idUsuario).pipe(
      switchMap(prof => {
        if (!prof?.urlFoto) return of(null);
        return this.cargarImagen(prof.urlFoto);
      })
    );
  }

  cargarImagenPerfilContratador(idUsuario: string) {
    return this.cargarUsuarioContratador(idUsuario).pipe(
      switchMap(cont => {
        if (!cont?.urlFoto) return of(null);
        return this.cargarImagen(cont.urlFoto);
      })
    );
  }

  mostrarError(mensaje: string): void {
    alert(mensaje);
  }

  irAPerfil(): void {
    this.router.navigate([`${this.rol}/perfil`]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
