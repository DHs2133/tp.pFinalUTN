import { Component, EventEmitter, inject, Output } from '@angular/core';
import { UsuarioProfesional } from '../../../interfaceUsuario/usuario.interface';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { UploadImageService } from '../../../../../service/back-end/upload-image.service';
import { VerificacionService } from '../../../../../utils/service/verificacion-usuario.service';
import { FileSelectService } from '../../../../../utils/FileSelectService';

@Component({
  selector: 'app-add-profesional',
  imports: [ReactiveFormsModule],
  templateUrl: './add-profesional.component.html',
  styleUrl: './add-profesional.component.css'
})
export class AddProfesionalComponent {

  // Inject del formbuilder
  fb = inject(FormBuilder);
  // Inject del servicio que verifica el mail en json-server
  verificacionService = inject(VerificacionService);
  // Inject del servicio que contiene a UsuarioProfesional
  serviceUsuProfesiona = inject(UsuarioProfesionalService);
  // Inject del servicio con el que voy a subir la foto
  uploadImage = inject(UploadImageService);
  // Inject del servicio para manejar el archivo
  manejoArchivo = inject(FileSelectService);
  // Si bien no tiene un API request ni es para manejar un HttpClient, lo hice así porque
  // no tiene sentido manejar un componente con .ts .html y .css por unas funciones reutilizables

  imageSrc: string = "imagendefecto.jpg";



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

      this.imageSrc = urlPrevisualizacion;
    }
    // Para evitar la repetición código, ya que el manejo de archivo para poder vincular la foto que se va a
    // subir a una entidad va a estar en este componente, en add-contratador y posiblemente en más partes, se
    // centralizó el código en un service.

    // No es recomendable que cada componente que utilice fotos tenga que crear su propia variable de tipo File,
    // ni definir una función onFileChange para asignar el valor de event.target.files[0] a dichas variables,
    // suscribirse al servicio y obtener la URL correspondiente.

  }



  agregarUsuarioProfesional(){


    const datos = this.formularioUsuarioProfesional.getRawValue();

    if(this.formularioUsuarioProfesional.invalid){

      alert("formulario invalido.")
      return

    }


    this.verificacionService.verificarUsuarioEnAmbasApis(datos.email).subscribe({
      next: (existe) => {
        if (existe) {
          alert("Ya existe una cuenta registrada con este email.");
        } else {

          const archivo = this.manejoArchivo.getArchivoSeleccionado();

          if(!archivo){
            alert("Debe seleccionar una imagen antes de continuar.");
            return;
          }

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
            /// this.router.navigate(['./inicioSesion']);  ME FALTARIA IMPLEMENTAR ALGO COMO ESTO
            ///this.formularioUsuarioProfesional.reset();
            ///this.manejoArchivo.reset()
            ///this.imageSrc = "imagendefecto.jpg"



          alert("Cuenta profesional creada con éxito.");
        },
        error: (err) => {
          console.error(err);
          alert("Debe subir una imágen.");
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

  // Método para cargar el usuario profesional en la BDD simulada
  agregarAUsuarioProfesionalBDD(usuarioProfNuevo: UsuarioProfesional){

    this.serviceUsuProfesiona.postUsuariosProfesionales(usuarioProfNuevo).subscribe({
      next: () => {
        alert('Usuario creado. Serás redirigido a iniciar sesión');

      },
      error: (e) => {
        console.error('Error al crear el usuario:', e);
      }
    });

  }


}
