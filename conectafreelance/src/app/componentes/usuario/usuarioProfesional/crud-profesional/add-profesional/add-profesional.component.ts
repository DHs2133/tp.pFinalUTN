import { Component, inject } from '@angular/core';
import { UsuarioProfesional } from '../../../interfaceUsuario/usuario.interface';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { VerificacionService } from '../../../../../utils/service/verificacion-usuario.service';
import { FileSelectService } from '../../../../../utils/FileSelectService';
import { Router } from '@angular/router';

@Component({
  selector: 'app-add-profesional',
  imports: [ReactiveFormsModule],
  templateUrl: './add-profesional.component.html',
  styleUrl: './add-profesional.component.css'
})
export class AddProfesionalComponent {

  imgSrc: string = "avatar.jpg";
  // Inject del formbuilder
  fb = inject(FormBuilder);
  // Inject del servicio que verifica el mail en json-server
  verificacionService = inject(VerificacionService);
  // Inject del servicio que contiene a UsuarioProfesional
  serviceUsuProf = inject(UsuarioProfesionalService);
  // Inject del servicio con el que voy a subir la foto
  uploadImage = inject(ImageService);
  // Inject del servicio para manejar el archivo
  manejoArchivo = inject(FileSelectService);
  // Si bien no tiene un API request ni es para manejar un HttpClient, lo hice así porque
  // no tiene sentido manejar un componente con .ts .html y .css por unas funciones reutilizables
  router = inject(Router)

  formularioUsuarioProfesional = this.fb.nonNullable.group({
    nombreCompleto: ['',[Validators.required]],
    email: ['',[Validators.required, Validators.email]],
    contrasenia: ['',[Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/)]],
    activo:[true],
    profesion:['', [Validators.required]],
    ciudad:["", Validators.required],
    provincia: ["", Validators.required],
    pais: ["", Validators.required],
  })


  // Método para guardar el archivo al seleccionarlo
  manejoDeArchivo(event: any) {

    this.manejoArchivo.onFileChange(event);
    const urlPrevisualizacion = this.manejoArchivo.getImagePreviewUrl()

    if(urlPrevisualizacion){

      this.imgSrc = urlPrevisualizacion;
    }
    // Para evitar la repetición código, ya que el manejo de archivo para poder vincular la foto que se va a
    // subir a una entidad va a estar en este componente, en add-contratador y posiblemente en más partes, se
    // centralizó el código en un service.

    // No es recomendable que cada componente que utilice fotos tenga que crear su propia variable de tipo File,
    // ni definir una función onFileChange para asignar el valor de event.target.files[0] a dichas variables,
    // suscribirse al servicio y obtener la URL correspondiente.

  }

  cancelar() {
    this.router.navigate(['/']); // Redirige a la página principal
  }




  agregarUsuarioProfesional(){


    const datos = this.formularioUsuarioProfesional.getRawValue();

    if(this.formularioUsuarioProfesional.invalid){

      alert("formulario invalido.")
      return

    }


    this.verificacionService.verificarUsuarioEnApis(datos.email).subscribe({
      next: (existe) => {
        if (existe) {
          alert("Ya existe una cuenta registrada con este email.");
        } else {

          const archivo = this.manejoArchivo.getArchivoSeleccionado();

          if(archivo){
            // Subir imagen
            this.subirImagen(archivo, datos)

          }else{
            alert("Debe subir una foto")
          }
        }
      },
      error: (err) => {
        console.error("Error al verificar email:", err);
        alert("Ocurrió un error al verificar el email. Intentá nuevamente.");
      }
    });

  }

  subirImagen(archivo: File, datos: any){

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

        this.arr(usuarioProfesionalNuevo);

      },
      error: (err) => {
        console.error(err);
        alert("Error al subir una imágen.");
      }
    });

  }


  arr(usuarioProfesionalNuevo: UsuarioProfesional){
    this.agregarAUsuarioProfesionalBDD(usuarioProfesionalNuevo);
    this.reseteo();
    this.redirección();
  }

  // Método para cargar el usuario profesional en la BDD simulada
  agregarAUsuarioProfesionalBDD(usuarioProfNuevo: UsuarioProfesional){

    this.serviceUsuProf.postUsuariosProfesionales(usuarioProfNuevo).subscribe({
      next: () => {
        alert('Usuario creado. Serás redirigido a inicio de sesión');

      },
      error: (e) => {
        console.error('Error al crear el usuario:', e, 'Será redirigido a la página principal');
        this.router.navigate(['']);

      }
    });

  }

  reseteo(){
    this.formularioUsuarioProfesional.reset();
    this.imgSrc = "imagendefecto.jpg"
    this.manejoArchivo.clearSelection();
  }

  redirección(){
    this.router.navigate(['/login']);
  }

}
