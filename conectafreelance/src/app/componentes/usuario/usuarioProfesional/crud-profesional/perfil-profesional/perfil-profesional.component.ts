import { Component, inject, OnInit } from '@angular/core';
import { LoginService } from '../../../../../utils/service/login-service.service';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesional } from './../../../interfaceUsuario/usuario.interface';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-perfil-profesional',
  imports:[RouterLink],
  templateUrl: './perfil-profesional.component.html',
  styleUrls: ['./perfil-profesional.component.css']
})
export class PerfilProfesionalComponent implements OnInit{
  email: string = '';
  imagenUrl!: SafeUrl;

  usuarioProf!: UsuarioProfesional;

  loginService = inject(LoginService);
  profService = inject(UsuarioProfesionalService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);

  ngOnInit() {
    this.email = this.loginService.getEmail();
    this.traerUsuarioProfesionalDeBDD();
  }

  traerUsuarioProfesionalDeBDD() {
    this.profService.getUsuariosProfesionalPorEmail(this.email).subscribe({
      next: (usu: UsuarioProfesional[]) => {
        if (usu.length > 0) {
          this.usuarioProf = usu[0];
          this.cargarImagen(this.usuarioProf.urlFoto);
        } else {
          alert('Ha ocurrido un error. Vuelva a iniciar sesión');
          this.loginService.clearEmail();
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
}
