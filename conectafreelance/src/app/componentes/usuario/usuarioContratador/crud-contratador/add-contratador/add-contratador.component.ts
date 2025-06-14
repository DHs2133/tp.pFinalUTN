import { routes } from './../../../../../app.routes';
import { UsuarioContratadorService } from './../../service/usuario-contratador.service';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VerificacionService } from '../../../../../utils/service/verificacion-usuario.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { FileSelectService } from '../../../../../utils/FileSelectService';
import { UsuarioContratador } from '../../../interfaceUsuario/usuario.interface';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-contratador',
  imports: [ReactiveFormsModule],
  templateUrl: './add-contratador.component.html',
  styleUrl: './add-contratador.component.css'
})
export class AddContratadorComponent {


  imgSrc: string = "avatar.jpg"
  fb = inject(FormBuilder);
  // Inject del servicio que verifica que el mail de registro sea único
  verificacionService = inject(VerificacionService);
  // Inject del servicio que contiene al usuario contratador
  usuarioContService = inject(UsuarioContratadorService);
  // Inject del servicio con el que voy a subir la foto
  uploadImage = inject(ImageService);
  // Inject del servicio para manejar el archivo
  manejoArchivo = inject(FileSelectService);
  router = inject(Router);


  formularioUsuarioContratador = this.fb.nonNullable.group({
    nombreCompleto: ['',[Validators.required]],
    email: ['',[Validators.required, Validators.email]],
    contrasenia: ['',[Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/)]],
    empresaRepresentada:[""]
  })




  manejoDeArchivo(event: any) {
    this.manejoArchivo.onFileChange(event);
    const urlPrevisualizacion = this.manejoArchivo.getImagePreviewUrl()

    if(urlPrevisualizacion){

      this.imgSrc = urlPrevisualizacion;
    }

  }

  cancelar() {
    this.router.navigate(['/']); // Redirige a la página principal
  }

  agregarUsuarioContratador(){


    const datos = this.formularioUsuarioContratador.getRawValue();

    if(this.formularioUsuarioContratador.invalid){

      alert("formulario invalido.")
      return

    }

    this.verificacionService.verificarUsuarioEnApis(datos.email).subscribe({
      next: (existe) => {
        if (existe) {
          alert("Ya existe una cuenta registrada con este email.");
        } else {

          const archivo = this.manejoArchivo.getArchivoSeleccionado();

          // Subir imagen
          this.uploadImage.subirImagen(archivo).subscribe({
            ///Subo el archivo y se me devuelve la url de la foto
          next: ({ urlFoto }) => {
            const usuarioContratadorNuevo: UsuarioContratador = {
              ...datos,
              urlFoto,
              rol: 'contratador',
              activo: true,
            };

            this.formularioUsuarioContratador.reset();
            this.agregarAUsuarioContratadorBDD(usuarioContratadorNuevo);
            this.imgSrc = "avatar.jpg"
            this.router.navigate(['/login']); // Redirige al login

        },
        error: (err) => {
          console.error(err);
          alert("Error al subir la imagen.");
        }
      });
        }
      },
      error: (err) => {
        console.error("Error al verificar email:", err);
        alert("Ocurrió un error al verificar el email. Intentá nuevamente.");
      }
    });

  }


  agregarAUsuarioContratadorBDD(usuarioContNuevo: UsuarioContratador){

      this.usuarioContService.postUsuariosContratadores(usuarioContNuevo).subscribe({
        next: () => {
          alert('Usuario creado. Serás redirigido a inicio de sesion');

        },
        error: (e) => {
          console.error('Error al crear el usuario:', e);
        }
      });

  }

}


