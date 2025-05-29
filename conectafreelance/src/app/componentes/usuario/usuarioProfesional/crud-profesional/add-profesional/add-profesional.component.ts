import { Component, EventEmitter, inject, Output } from '@angular/core';
import { UsuarioProfesional } from '../../../interfaceUsuario/usuario.interface';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VerificacionService } from '../../../../../utils/verificacion-usuario.service';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { UploadImageService } from '../../../../../service/back-end/upload-image.service';

@Component({
  selector: 'app-add-profesional',
  imports: [ReactiveFormsModule],
  templateUrl: './add-profesional.component.html',
  styleUrl: './add-profesional.component.css'
})
export class AddProfesionalComponent {

  @Output()
  emitirUsuarioProfesional: EventEmitter<UsuarioProfesional> = new EventEmitter();

  // Inject del formbuilder
  fb = inject(FormBuilder);
  // Inject del servicio que verifica el mail en json-server
  verificacionService = inject(VerificacionService);
  // Inject del servicio que contiene a UsuarioProfesional
  serviceUsuProfesiona = inject(UsuarioProfesionalService);
  // Inject del servicio con el que voy a subir la foto
  uploadImage = inject(UploadImageService);

  archivoSeleccionado!: File;


  formularioUsuarioProfesional = this.fb.nonNullable.group({
    nombreCompleto: ['',[Validators.required]],
    email: ['',[Validators.required, Validators.email]],
    contrasenia: ['',[Validators.required, Validators.minLength(5), Validators.maxLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/)]],
    activo:[true],
    profesion:['', [Validators.required]],
    ciudad:["", Validators.required],
    provincia: ["", Validators.required],
    pais: ["", Validators.required],

  })


    // Método para guardar el archivo al seleccionarlo
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado = file;
    }
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

          // Subir imagen
        this.uploadImage.subirImagen(this.archivoSeleccionado).subscribe({
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

  agregarAUsuarioProfesionalBDD(usuarioProfNuevo: UsuarioProfesional){

    this.serviceUsuProfesiona.postUsuariosProfesionales(usuarioProfNuevo).subscribe({
      next: () => {
        alert('Usuario creado. Serás redirigido a iniciar sesión');

        ///         this.router.navigate(['./inicioSesion']);  ME FALTARIA IMPLEMENTAR ALGO COMO ESTOOOOO
      },
      error: (e) => {
        console.error('Error al crear el usuario:', e);
      }
    });

  }


}
