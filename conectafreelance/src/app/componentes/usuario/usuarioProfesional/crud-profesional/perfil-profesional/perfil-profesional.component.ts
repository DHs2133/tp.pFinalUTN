import { Component, inject, OnInit } from '@angular/core';
import { LoginService } from '../../../../../utils/service/login-service.service';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesional } from './../../../interfaceUsuario/usuario.interface';
import { Router, RouterModule } from '@angular/router';
import { AddPublicacionComponent } from "../../../../publicacion/add-publicacion/add-publicacion.component";

@Component({
  selector: 'app-perfil-profesional',
  imports: [RouterModule, AddPublicacionComponent],
  templateUrl: './perfil-profesional.component.html',
  styleUrls: ['./perfil-profesional.component.css']
})
export class PerfilProfesionalComponent implements OnInit{
  id: string = '';
  imagenUrl!: SafeUrl;

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
    this.profService.getUsuariosProfesionalPorID(this.id).subscribe({
      next: (usu: UsuarioProfesional) => {
        if (usu) {
          this.usuarioProf = usu;
          this.cargarImagen(this.usuarioProf.urlFoto);
        } else {
          alert('Ha ocurrido un error. Vuelva a iniciar sesión');
          this.loginService.clearId();
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
