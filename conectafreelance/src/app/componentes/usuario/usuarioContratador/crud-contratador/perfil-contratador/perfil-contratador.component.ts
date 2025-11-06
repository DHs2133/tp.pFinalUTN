import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { UsuarioContratador } from '../../../interfaceUsuario/usuario.interface';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioContratadorService } from '../../service/usuario-contratador.service';
import { LoginService } from '../../../../../utils/service/login-service.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { ListComentarioContPerfComponent } from "../../../../comentario/list-comentario-cont-perf/list-comentario-cont-perf.component";
import { ListFavoritosComponent } from "../../../../favoritos/list-favoritos/list-favoritos.component";

@Component({
  selector: 'app-perfil-contratador',
  imports: [RouterModule, ListComentarioContPerfComponent, ListFavoritosComponent],
  templateUrl: './perfil-contratador.component.html',
  styleUrl: './perfil-contratador.component.css'
})
export class PerfilContratadorComponent implements OnInit, OnDestroy {

  id: string = '';
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

  loginService = inject(LoginService);
  contService = inject(UsuarioContratadorService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);

  ngOnInit() {
    this.id = this.loginService.getId();
    this.traerUsuarioContratadorDeBDD();
  }

  setActiveTab(tab: 'comentarios' | 'listaFav'): void {
    this.activeTab = tab;
  }

  traerUsuarioContratadorDeBDD() {
    this.contService.getUsuariosContratadoresPorId(this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (usu: UsuarioContratador) => {
        if (usu) {


          if(!usu.activo){

            this.router.navigate(['/cuenta-desactivada']);
          }

          this.usuarioCont = usu;
          this.cargarImagen(this.usuarioCont.urlFoto);
        } else {
          alert('Ha ocurrido un error. Vuelva a iniciar sesión');
          this.loginService.clear();
          this.router.navigate(['/home']);
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
