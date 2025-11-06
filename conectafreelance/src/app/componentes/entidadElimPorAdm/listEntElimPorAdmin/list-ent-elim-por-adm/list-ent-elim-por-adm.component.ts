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
import { EntElimPorAdm, Entidad } from '../../interfaceEntElimPorAdmin/int-ent-elim-por-adm';

@Component({
  selector: 'app-list-ent-elim-por-adm',
  imports: [],
  templateUrl: './list-ent-elim-por-adm.component.html',
  styleUrl: './list-ent-elim-por-adm.component.css'
})
export class ListEntElimPorAdmComponent {

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
  comentario: Comentario | null = null;
  publicacion: Publicacion | null = null;
  usuarioProfesional: UsuarioProfesional | null = null;
  usuarioContratador: UsuarioContratador | null = null;

  imgPerfilProfesional: SafeUrl | null = null;
  imgPerfilContratador: SafeUrl | null = null;
  imgPublicacion: SafeUrl | null = null;
  entidad: Entidad | null = null;



  ngOnInit(): void {
    if (!this.idSesion || !this.rol) {
      this.irAPerfil();
      return;
    }

    this.cargarEntidadDesdeRuta();
  }

  private cargarEntidadDesdeRuta(): void {
    this.route.paramMap.pipe(
      map(params => params.get('idEnt')),
      filter((id): id is string => id !== null),
      switchMap(idEntidad => this.cargarEntidadPorId(idEntidad)),
      takeUntil(this.destroy$)
    ).subscribe({
      error: (err) => {
        console.error('Error al cargar entidad:', err);
        this.mostrarError('No se pudo cargar la entidad eliminada.');
        this.irAPerfil();
      }
    });
  }

  private cargarEntidadPorId(idEntidad: string) {
    return this.entidadesService.getPublicacionesPorIDDuenio(this.idSesion!).pipe(
      map((listaEntElim: EntElimPorAdm[]) => {
        if (!listaEntElim.length) return null;

        const registro = listaEntElim[0];
        if (registro.idDuenio !== this.idSesion) return null;

        return registro.entidades.find(e => e.id === idEntidad) || null;
      }),
      filter((entidad): entidad is Entidad => entidad !== null),
      switchMap(entidad => this.procesarEntidad(entidad))
    );
  }

  procesarEntidad(entidad: Entidad) {
    this.entidad = entidad;

    if (entidad.publicElim) {
      this.esPublicacion = true;
      this.publicacion = entidad.publicElim;
      return this.cargarDatosPublicacion(entidad.publicElim);
    }

    if (entidad.comentElim) {
      this.esPublicacion = false;
      this.comentario = entidad.comentElim;
      return this.cargarDatosComentario(entidad.comentElim);
    }

    return EMPTY;
  }

  cargarDatosPublicacion(pub: Publicacion) {
    return forkJoin({
      profesional: this.cargarUsuarioProfesional(pub.idCreador),
      imagen: pub.urlFoto ? this.cargarImagen(pub.urlFoto) : of(null)
    }).pipe(
      tap(({ profesional, imagen }) => {
        this.usuarioProfesional = profesional;
        this.imgPublicacion = imagen;
        this.cargarImagenPerfilSiExiste(profesional?.urlFoto, 'profesional');
      })
    );
  }

  private cargarDatosComentario(com: Comentario) {
    return forkJoin({
      contratador: this.cargarUsuarioContratador(com.idCreador),
      profesional: this.cargarUsuarioProfesional(com.idDestinatario)
    }).pipe(
      tap(({ contratador, profesional }) => {
        this.usuarioContratador = contratador;
        this.usuarioProfesional = profesional;
        this.cargarImagenPerfilSiExiste(contratador?.urlFoto, 'contratador');
        this.cargarImagenPerfilSiExiste(profesional?.urlFoto, 'profesional');
      })
    );
  }

  cargarUsuarioProfesional(id: string) {
    return this.usuarioProfService.getUsuariosProfesionalPorID(id).pipe(
      catchError(err => {
        this.mostrarError('Error al cargar profesional.');
        console.error(err);
        return of(null);
      })
    );
  }

  cargarUsuarioContratador(id: string) {
    return this.usuarioContService.getUsuariosContratadoresPorId(id).pipe(
      catchError(err => {
        this.mostrarError('Error al cargar contratador.');
        console.error(err);
        return of(null);
      })
    );
  }

  cargarImagen(fileName: string) {
    return this.imageService.getImagen(fileName).pipe(
      map(blob => this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob))),
      catchError(err => {
        console.error('Error imagen:', fileName, err);
        return of(null);
      })
    );
  }

  cargarImagenPerfilSiExiste(urlFoto: string | undefined, tipo: 'profesional' | 'contratador') {
    if (!urlFoto) return;
    this.cargarImagen(urlFoto).subscribe(img => {
      if (tipo === 'profesional') this.imgPerfilProfesional = img;
      if (tipo === 'contratador') this.imgPerfilContratador = img;
    });
  }

  mostrarError(msg: string) {
    alert(msg);
  }

  irAPerfil() {
    this.router.navigate([`${this.rol}/perfil`]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }


/*

  idSesion: string|null = null;
  idEntidad: string|null = null;
  rol: string|null = null;
  usuarioProfesional: UsuarioProfesional|null = null;
  usuarioContratador: UsuarioContratador|null = null;
  destroy$ = new Subject<void>();
  comentario: Comentario | null = null;
  publicacion: Publicacion | null = null;
  imgPerfCont!: SafeUrl
  imgPerfProf!: SafeUrl
  imgPublicacion!: SafeUrl
  esPublicacion: boolean = true;




  usuarioProfesionalService = inject(UsuarioProfesionalService);
  usuarioContratadorService = inject(UsuarioContratadorService);
  loginService = inject(LoginService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  entidadesEliminadasService = inject(ServEntElimPorAdmService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);



  ngOnInit(){
    this.idSesion = this.loginService.getId();
    this.rol = this.loginService.getRol();

    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idEntidad = param.get('idEnt');
        if (this.idEntidad && this.idSesion) {
          this.getEntidad(this.idSesion, this.idEntidad);
        }else{
          this.router.navigate([`${this.rol}/perfil`]);
        }

      },
      error: (err) => {
        console.error('Error al obtener parámetros de la ruta:', err);
        this.router.navigate([`${this.rol}/perfil`]);
      },
    });
  }


  getEntidad(idSesion: string, idEntidad: string){
    this.entidadesEliminadasService.getPublicacionesPorIDDuenio(idSesion).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        if(value.length > 0){
          const listaDeEntElim = value[0];
          listaDeEntElim.entidades.forEach(e => {
            if(e.id === idEntidad){

              if(e.comentElim){

                this.esPublicacion = false;
                this.comentario = e.comentElim;
                this.obtenerUsuarioContratador(e.comentElim.idCreador);
                this.obtenerUsuarioProfesional(e.comentElim.idDestinatario);

              }

              if(e.publicElim){

                this.esPublicacion = true;
                this.publicacion = e.publicElim
                this.obtenerUsuarioProfesional(e.publicElim.idCreador);

              }
            }
          })
        }
      },
      error : (err) => {
        alert("Ha ocurrido un error al obtener la entidad eliminada por el usuario administrador.");
      },
    })
  }


  obtenerUsuarioProfesional(idProf: string){
    this.usuarioProfesionalService.getUsuariosProfesionalPorID(idProf).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        this.usuarioProfesional = value;
        this.cargarImagenPerfilProfesional(this.usuarioProfesional.urlFoto);
      },
      error : (err) => {
        if(!this.esPublicacion){
          alert("Ha ocurrio un error. No se pudo obtener los datos del usuario al que le ha realizado el comentario.");
        }else{
          alert("Ha ocurrio un error. No se pudo obtener los datos del usuario en sesión");

        }

        console.error("Error: " + err);
      },
    })
  }


  obtenerUsuarioContratador(idCont: string){
    this.usuarioContratadorService.getUsuariosContratadoresPorId(idCont).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        this.usuarioContratador = value;
        this.cargarImagenPerfilProfesional(this.usuarioContratador.urlFoto);

      },
      error : (err) => {
        alert("Ha ocurrio un error. No se pudo obtener los datos el usuario que ha realizado el comentario.");
        console.error("Error: " + err);
      },
    })
  }


  cargarImagenPerfilProfesional(fileName: string) {

    this.imageService.getImagen(fileName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imgPerfProf = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        console.error(err);
        alert('Error al cargar la imagen');
      }
    });
  }

  cargarImagenPerfilContratador(fileName: string) {

    this.imageService.getImagen(fileName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imgPerfCont = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        console.error(err);
        alert('Error al cargar la imagen');
      }
    });
  }

  cargarImagenPublicacion(fileName: string) {

    this.imageService.getImagen(fileName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imgPublicacion = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        console.error(err);
        alert('Error al cargar la imagen');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
*/
}
