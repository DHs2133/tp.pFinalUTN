import { Component, inject, OnDestroy } from '@angular/core';
import { UsuarioProfesional } from '../../../interfaceUsuario/usuario.interface';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { VerificacionService } from '../../../../../utils/service/verificacion-usuario.service';
import { FileSelectService } from '../../../../../utils/FileSelectService';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { noWhitespaceValidator } from '../../../../../utils/ValidadoresPersonalizados';
import { NotificacionService } from '../../../../notificacion/notificacionService/notificacion.service';
import { ListaNotificaciones } from '../../../../notificacion/interfaceNotificacion/notificacion.interface';

@Component({
  selector: 'app-add-profesional',
  imports: [ReactiveFormsModule],
  templateUrl: './add-profesional.component.html',
  styleUrl: './add-profesional.component.css'
})
export class AddProfesionalComponent implements OnDestroy{

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
  router = inject(Router);
  listaNotServ = inject(NotificacionService);

  destroy$ = new Subject<void>();


  formularioUsuarioProfesional = this.fb.nonNullable.group({
    nombreCompleto: ["",[Validators.required, noWhitespaceValidator()]],
    email: ["",[Validators.required, Validators.email, noWhitespaceValidator()]],
    contrasenia: ["",[Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/), noWhitespaceValidator()]],
    activo:[true],
    profesion:["", [Validators.required, noWhitespaceValidator()]],
    descripcion: ["", [Validators.required, Validators.maxLength(220), noWhitespaceValidator()]],
    ciudad:["", [Validators.required, noWhitespaceValidator()]],
    provincia: ["", [Validators.required, noWhitespaceValidator()]],
    pais: ["", [Validators.required, noWhitespaceValidator()]],
  })






  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



  // Método para guardar el archivo al seleccionarlo
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




  agregarUsuarioProfesional(){


    const datos = this.formularioUsuarioProfesional.getRawValue();

    if(this.formularioUsuarioProfesional.invalid){

      alert("formulario invalido.")
      return

    }


    this.verificacionService.verificarUsuarioEnApis(datos.email).pipe(takeUntil(this.destroy$)).subscribe({
      next: (existe) => {
        if (existe) {
          alert("Ya existe una cuenta registrada con este email.");
        } else {

          const archivo = this.manejoArchivo.getArchivoSeleccionado();

          if(archivo){
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

    this.uploadImage.subirImagen(archivo).pipe(takeUntil(this.destroy$)).subscribe({
      ///Subo el archivo y se me devuelve la url de la foto
      next: ({ urlFoto }) => {
        const usuarioProfesionalNuevo: UsuarioProfesional = {
          ...datos,
          urlFoto,
          rol: 'profesional',
          activo: true,
          promedio: 0,
          cantComentarios: 0,
          cantPubRep: 0
        };

        this.agregarAUsuarioProfesionalBDD(usuarioProfesionalNuevo);

      },
      error: (err) => {
        console.error(err);
        alert("Error al subir una imágen.");
      }
    });

  }


  agregarAUsuarioProfesionalBDD(usuarioProfNuevo: UsuarioProfesional){

    this.serviceUsuProf.postUsuariosProfesionales(usuarioProfNuevo).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {

        this.generarListaNotificaciones(value);

      },
      error: (e) => {
        console.error('Error al crear el usuario:', e, 'Será redirigido a la página principal');
        this.eliminarFoto(usuarioProfNuevo);
        this.redireccionHome();

      }
    });

  }

  eliminarFoto(usu: UsuarioProfesional){
    this.uploadImage.deleteImage(usu.urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        console.log("Imágen borrada");
      },
      error: (err) => {
        console.log("No se pudo borrar la imágen");

      },
    })
  }


  generarListaNotificaciones(usuNvo: UsuarioProfesional){

    const listaNot: ListaNotificaciones = {

      idDuenio: usuNvo.id as string,

      notificaciones: [{
        descripcion: `Cuenta creada. Bienvenido, ${usuNvo.nombreCompleto}`,
        leido: false
      }]
    }

    this.listaNotServ.postListaNotificaciones(listaNot).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        console.log("Lista de notificaciones creada.");
        alert('Usuario creado. Serás redirigido a inicio de sesión');
        this.reseteo();
        this.redirecciónLogin();


      },
      error: (e) => {

        this.eliminarFoto(usuNvo);
        this.eliminarUsuarioProfesional(usuNvo.id as string);

        console.error('Error al crear el usuario:', e, "Será redirigido a la página principal");
        this.redireccionHome();
      }
    })
  }

  eliminarUsuarioProfesional(id: string){

    this.serviceUsuProf.deleteUsuarioProfesionalById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        console.log("Usuario profesional eliminado")
      },
      error : (err) => {
        console.log("No se ha podido borrar la foto")
      }

    })
  }






  reseteo(){
    this.formularioUsuarioProfesional.reset();
    this.imgSrc = "imagendefecto.jpg"
    this.manejoArchivo.clearSelection();
  }



  redirecciónLogin(){
    this.router.navigate(['/login']);
  }

  redireccionHome(){
    this.router.navigate(['/']);
  }



}
