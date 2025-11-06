import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioContratador } from '../../../interfaceUsuario/usuario.interface';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioContratadorService } from '../../service/usuario-contratador.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../../../../utils/service/login-service.service';
import { ListFavoritosPerfilAdminContComponent } from '../../../../favoritos/list-favoritos-perfil-admin-cont/list-favoritos-perfil-admin-cont.component';

@Component({
  selector: 'app-admin-contratador-perfil',
  imports: [ListFavoritosPerfilAdminContComponent],
  templateUrl: './admin-contratador-perfil.component.html',
  styleUrl: './admin-contratador-perfil.component.css'
})
export class AdminContratadorPerfilComponent {

  idContratador: string|null = null;
  idAdminSesion: string = '';
  imagenUrl!: SafeUrl;
  activeTab: 'comentarios' | 'listaFav' = 'listaFav';
  usuarioCont: UsuarioContratador = {

    id: " ",
    nombreCompleto: " ",
    email: " ",
    contrasenia: " ",
    urlFoto: " ",
    activo: true,
    rol: "contratador",
    empresaRepresentada: "",
    cantComRep: 0

  }
  destroy$ = new Subject<void>();

  contService = inject(UsuarioContratadorService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  loginService = inject(LoginService);
  activatedRoute = inject(ActivatedRoute);


  ngOnInit() {
    this.idAdminSesion = this.loginService.getId();
    this.obtenerIdContratador();

  }

  obtenerIdContratador(){

    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idContratador = param.get('id');
        if (this.idContratador) {
          this.traerUsuarioContratadorDeBDD(this.idContratador);
        }
      },
      error: (err) => {
        console.error('Error al obtener parámetros de la ruta:', err);
        this.router.navigate(['profesional/perfil']);
      },
    });
  }

  setActiveTab(tab: 'comentarios' | 'listaFav'): void {
    this.activeTab = tab;
  }

  traerUsuarioContratadorDeBDD(idContratador: string) {
    this.contService.getUsuariosContratadoresPorId(idContratador).pipe(takeUntil(this.destroy$)).subscribe({
      next: (usu: UsuarioContratador) => {
        if (usu) {

          this.usuarioCont = usu;
          this.cargarImagen(this.usuarioCont.urlFoto);


        } else {
          alert('Ha ocurrido un error. Será redirigido a su perfil');
          this.router.navigate(['admin/perfil']);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Ha ocurrido un error en el servidor');
      }
    });
  }

  cargarImagen(fileName: string) {
    this.imageService.getImagen(fileName).subscribe({
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


  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();

  }

}
