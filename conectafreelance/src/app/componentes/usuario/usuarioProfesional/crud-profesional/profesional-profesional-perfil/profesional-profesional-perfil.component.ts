import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesional } from '../../../interfaceUsuario/usuario.interface';
import { Subject, takeUntil } from 'rxjs';
import { LoginService } from '../../../../../utils/service/login-service.service';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ListComentarioProfprofperfComponent } from "../../../../comentario/list-comentario-profprofperf/list-comentario-profprofperf.component";
import { ListPublicacionesProfprofperfComponent } from "../../../../publicacion/list-publicaciones-profprofperf/list-publicaciones-profprofperf.component";

@Component({
  selector: 'app-profesional-profesional-perfil',
  imports: [ListComentarioProfprofperfComponent, ListPublicacionesProfprofperfComponent],
  templateUrl: './profesional-profesional-perfil.component.html',
  styleUrl: './profesional-profesional-perfil.component.css'
})
export class ProfesionalProfesionalPerfilComponent {

  idProfesional: string | null = null;
  idSesion: string | null = null;
  imagenUrl!: SafeUrl;
  activeTab: 'publicaciones' | 'comentarios' = 'publicaciones';
  usuarioProf: UsuarioProfesional = {

    id: " ",
    nombreCompleto: " ",
    email: " ",
    contrasenia: " ",
    urlFoto: " ",
    activo: true,
    rol: "profesional",
    profesion: " ",
    descripcion: " ",
    ciudad: " ",
    provincia: " ",
    pais: " ",
    promedio: 0,
    cantComentarios: 0,
    cantPubRep: 0

  }
  destroy$ = new Subject<void>();


  loginService = inject(LoginService);
  profService = inject(UsuarioProfesionalService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);



  ngOnInit() {
    this.obtenerIDProfesional();
    this.idSesion = this.loginService.getId();
  }

  obtenerIDProfesional(){
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idProfesional = param.get('id');
        if (this.idProfesional) {
          this.traerUsuarioProfesionalDeBDD();
        }
      },
      error: (err) => {
        console.error('Error al obtener parámetros de la ruta:', err);
        this.router.navigate(['profesional/perfil']);
      },
    });
  }

  traerUsuarioProfesionalDeBDD() {
    this.profService.getUsuariosProfesionalPorID(this.idProfesional).pipe(takeUntil(this.destroy$)).subscribe({
      next: (usu: UsuarioProfesional) => {
        if (usu) {
          this.usuarioProf = usu;

          this.cargarImagen(this.usuarioProf.urlFoto);
        } else {
          alert('Ha ocurrido un error.');
          this.router.navigate(['profesional/perfil']);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Ha ocurrido un error en el servidor');
        this.router.navigate(['profesional/perfil']);

      }
    });
  }

  cargarImagen(fileName: string) {
    this.imageService.getImagen(fileName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        console.error(err);
        alert('Error al cargar la imagen');
      }
    });
  }

  setActiveTab(tab: 'publicaciones' | 'comentarios'): void {
    this.activeTab = tab;
  }


  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();

  }

}
