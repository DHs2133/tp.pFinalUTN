import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { LoginService } from '../../../../../utils/service/login-service.service';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesional } from './../../../interfaceUsuario/usuario.interface';
import { Router, RouterModule } from '@angular/router';
import { AddPublicacionComponent } from "../../../../publicacion/add-publicacion/add-publicacion.component";
import { CommonModule } from '@angular/common';
import { ListComentarioComponent } from "../../../../comentario/list-comentario/list-comentario.component";
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-perfil-profesional',
  imports: [CommonModule, RouterModule, AddPublicacionComponent, ListComentarioComponent],
  templateUrl: './perfil-profesional.component.html',
  styleUrls: ['./perfil-profesional.component.css']
})
export class PerfilProfesionalComponent implements OnInit, OnDestroy{

  id: string = '';
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
    cantComentarios: 0

  }
  destroy$ = new Subject<void>();

  loginService = inject(LoginService);
  profService = inject(UsuarioProfesionalService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);

  ngOnInit() {
    this.id = this.loginService.getId();
    this.traerUsuarioProfesionalDeBDD();
  }

  traerUsuarioProfesionalDeBDD() {
    this.profService.getUsuariosProfesionalPorID(this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (usu: UsuarioProfesional) => {
        if (usu) {
          this.usuarioProf = usu;
          this.cargarImagen(this.usuarioProf.urlFoto);
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
