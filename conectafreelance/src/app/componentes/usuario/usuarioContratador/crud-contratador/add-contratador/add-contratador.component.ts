import { UsuarioContratadorService } from './../../service/usuario-contratador.service';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VerificacionService } from '../../../../../utils/service/verificacion-usuario.service';
import { UploadImageService } from '../../../../../service/back-end/upload-image.service';
import { FileSelectService } from '../../../../../utils/FileSelectService';

@Component({
  selector: 'app-add-contratador',
  imports: [ReactiveFormsModule],
  templateUrl: './add-contratador.component.html',
  styleUrl: './add-contratador.component.css'
})
export class AddContratadorComponent {


  imgSrc: string = "imagendefecto.jpg"

  fb = inject(FormBuilder);
  verificacionService = inject(VerificacionService);
  usuarioContService = inject(UsuarioContratadorService);

    // Inject del servicio con el que voy a subir la foto
    uploadImage = inject(UploadImageService);
    // Inject del servicio para manejar el archivo
    manejoArchivo = inject(FileSelectService);

  formularioUsuarioContratador = this.fb.nonNullable.group({
    nombreCompleto: ['',[Validators.required]],
    email: ['',[Validators.required, Validators.email]],
    contrasenia: ['',[Validators.required, Validators.minLength(5), Validators.maxLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/)]],
    urlFoto: ["",[Validators.required]],
    empresaRepresentada:[""]
  })




manejoDeArchivo(event: any) {
    this.manejoArchivo.onFileChange(event);
    const urlPrevisualizacion = this.manejoArchivo.getImagePreviewUrl()

    if(urlPrevisualizacion){

      this.imgSrc = urlPrevisualizacion;
    }

  }












/*




agregarUsuarioProfesional(){


    const datos = this.formularioUsuarioContratador.getRawValue();

    if(this.formularioUsuarioContratador.invalid){

      alert("formulario invalido.")
      return

    }

    this.verificacionService.verificarUsuarioEnAmbasApis(datos.email).subscribe({
      next: (existe) => {
        if (existe) {
          alert("Ya existe una cuenta registrada con este email.");
        } else {

          const archivo = this.manejoArchivo.getArchivoSeleccionado();

          // Subir imagen
          this.uploadImage.subirImagen(archivo).subscribe({
            ///Subo el archivo y se me devuelve la url de la foto
          next: ({ urlFoto }) => {
            const usuarioProfesionalNuevo: UsuarioProfesional = {
              ...datos,
              urlFoto,
              rol: 'profesional',
              activo: true,
              descripcion: " ",
              promedio: 0,
              cantComentarios: 0
            };
            this.agregarAUsuarioProfesionalBDD(usuarioProfesionalNuevo);
          alert("Cuenta profesional creada con éxito.");
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


  */















 /*

  agregarUsuarioContratador() {
    const datos = this.formularioUsuarioContratador.getRawValue();

    if (this.formularioUsuarioContratador.invalid) {
      // Si el formulario por alguna razón no es válido:
      alert("Formulario no válido");
      // Se emite una alerta
      return;
      // Y no se devuelve nada
    }

    // En caso de que el formulario sea válido, se verifica el email en ambas APIs
    this.verificacionService.verificarUsuarioEnAmbasApis(datos.email).subscribe({

      next: (existe) => {
        if (existe) {
          alert("Ya existe una cuenta registrada con este email.");
        } else {
          const usuarioContratadorNuevo: UsuarioContratador = {
            ...datos,
            rol: "base",
            activo: true
          };

          /// this.agregarAUsuarioProfesionalBDD(usuarioContratadorNuevo);
          /// this.router.navigate(['./inicioSesion']);  ME FALTARIA IMPLEMENTAR ALGO COMO ESTOOOOO

          alert("Cuenta contratadora creada con éxito");
        }
      },
      error: (err) => {
        console.error("Error verificando email:", err);
        alert("Ocurrió un error al verificar el email. Intentá nuevamente.");
      }
    });
  }


  agregarAUsuarioProfesionalBDD(usuarioContNuevo: UsuarioContratador){

      this.usuarioContService.postUsuariosContratadores(usuarioContNuevo).subscribe({
        next: () => {
          alert('Usuario creado. Serás redirigido a iniciar sesión');

        },
        error: (e) => {
          console.error('Error al crear el usuario:', e);
        }
      });

  }

  */
}


