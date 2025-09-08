import { Component, inject, OnInit } from '@angular/core';
import { LoginService } from '../../../utils/service/login-service.service';
import { Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { ImageService } from '../../../service/back-end/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';

@Component({
  selector: 'app-navbar-profesional-component',
  imports: [RouterModule],
  templateUrl: './navbar-profesional-component.component.html',
  styleUrl: './navbar-profesional-component.component.css'
})
export class NavbarProfesionalComponentComponent implements OnInit{


  id: string = '';
  imagenUrl!: SafeUrl;
  usuProf!: UsuarioProfesional;
  usuProfService = inject(UsuarioProfesionalService);

  router = inject(Router);
  loginService = inject(LoginService);
  profService = inject(UsuarioProfesionalService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.id = this.loginService.getId();
  }

  obtenerProfDeBDD(id: string){
    this.usuProfService.getUsuariosProfesionalPorID(id).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        this.usuProf = value;
      },
      error(err) {
        alert("Ha ocurrido un error al cargar el componente navbar.");
        console.log("Error: " + err);
      },


    })
  }


  obtenerImagenPerfil(nombreFoto: string){

    this.imageService.getImagen(nombreFoto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        console.error(err);
        alert('Error al cargar la imagen');
      }
    })
  }



  eliminar(){
    this.eliminarCuenta();

  }

  eliminarCuenta(){
    const confirmado = window.confirm("¿Estás seguro de que querés eliminar tu cuenta?");
    if (confirmado) {

      this.profService.deleteUsuarioProfesionalById(this.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () =>{
          alert("Cuenta eliminada exitosamente.");
          this.loginService.clear();
          this.eliminarFoto()
        },
        error: (err) => {
          alert("No se pudo eliminar la cuenta profesional");
          console.log("Error: " + err);
        },
      });
    }
  }

  eliminarFoto(){
    this.imageService.deleteImage(this.usuProf.urlFoto).pipe(takeUntil(this.destroy$)).subscribe({

      next : (value) => {
        console.log("Foto eliminada correctamente");
        this.router.navigate(['/home']);

      },
      error : (err) => {
        console.log("No se pudo eliminar la foto: " + err);

      },
    });

  }

  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();

  }

}
