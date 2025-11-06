import { routes } from './../../../../../app.routes';
import { UsuarioContratadorService } from './../../service/usuario-contratador.service';
import { Component, EventEmitter, inject, OnDestroy, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { VerificacionService } from '../../../../../utils/service/verificacion-usuario.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { FileSelectService } from '../../../../../utils/FileSelectService';
import { UsuarioContratador } from '../../../interfaceUsuario/usuario.interface';
import { Router } from '@angular/router';
import { noWhitespaceValidator } from '../../../../../utils/ValidadoresPersonalizados';
import { Favorito } from '../../../../favoritos/interfaceFavoritos/favorito.interface';
import { FavoritoService } from '../../../../favoritos/serviceFavorito/favorito.service';
import { Subject, takeUntil } from 'rxjs';
import { ListaNotificaciones } from '../../../../notificacion/interfaceNotificacion/notificacion.interface';
import { NotificacionService } from '../../../../notificacion/notificacionService/notificacion.service';

@Component({
  selector: 'app-add-contratador',
  imports: [ReactiveFormsModule],
  templateUrl: './add-contratador.component.html',
  styleUrl: './add-contratador.component.css'
})

export class AddContratadorComponent implements OnDestroy{

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
  favService = inject(FavoritoService);
  listaNotServ = inject(NotificacionService);
  destroy$ = new Subject<void>();


  formularioUsuarioContratador = this.fb.nonNullable.group({
    nombreCompleto: ['',[Validators.required, noWhitespaceValidator()]],
    email: ['',[Validators.required, Validators.email]],
    contrasenia: ['',[Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/)]],
    empresaRepresentada:["", noWhitespaceValidator()]
  })





  manejoDeArchivo(event: any) {
    this.manejoArchivo.onFileChange(event);
    const urlPrevisualizacion = this.manejoArchivo.getImagePreviewUrl()

    if(urlPrevisualizacion){

      this.imgSrc = urlPrevisualizacion;
    }

  }

  cancelar() {
    this.router.navigate(['/']);
  }

  agregarUsuarioContratador(){


    const datos = this.formularioUsuarioContratador.getRawValue();

    if(this.formularioUsuarioContratador.invalid){

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
        const usuarioContratadorNuevo: UsuarioContratador = {
          ...datos,
          urlFoto,
          rol: 'contratador',
          activo: true,
          cantComRep: 0
        };

        this.arr(usuarioContratadorNuevo);

      },
      error: (err) => {
        console.error(err);
        alert("Error al subir la imagen.");
      }
    })


  }

  arr(usuContrNuevo: UsuarioContratador){
    this.agregarAUsuarioContratadorBDD(usuContrNuevo);
    this.reseteo();
    this.redireccionLogin();

  }


  agregarAUsuarioContratadorBDD(usuarioContNuevo: UsuarioContratador){

    this.usuarioContService.postUsuariosContratadores(usuarioContNuevo).subscribe({
      next: (value) => {
        alert('Usuario creado. Serás redirigido a inicio de sesion');

        this.agregarListaFavoritos(value);
        this.generarListaNotificaciones(value);


      },
      error: (e) => {
        console.error('Error al crear el usuario:', e, "Será redirigido a la página principal");
        this.eliminarImagen(usuarioContNuevo.urlFoto);
        this.redireccionHome();
      }
    });
  }


  agregarListaFavoritos(usuNvo: UsuarioContratador){

    const favorito: Favorito = {
      idDuenio: usuNvo.id as string,
      idUsuariosFavoritos: []
    }

    this.favService.postFavorito(favorito).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        console.log("Lista de favoritos creada.");
      },
      error: (e) => {

        this.eliminarImagen(usuNvo.urlFoto);
        this.eliminarUsuarioContratador(usuNvo.id as string);
        this.eliminarListaNotificaciones(usuNvo.id as string)

        console.error('Error al crear el usuario:', e, "Será redirigido a la página principal");
        this.redireccionHome();
      }

    })

  }

  generarListaNotificaciones(usuNvo: UsuarioContratador){

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

      },
      error: (e) => {

        this.eliminarImagen(usuNvo.urlFoto);
        this.eliminarUsuarioContratador(usuNvo.id as string);
        this.eliminarListaFavoritos(usuNvo.id as string);

        console.error('Error al crear el usuario:', e, "Será redirigido a la página principal");
        this.redireccionHome();
      }
    })
  }

  reseteo(){
    this.formularioUsuarioContratador.reset();
    this.manejoArchivo.clearSelection();
    this.imgSrc = "avatar.jpg";
  }

  redireccionLogin(){
    this.router.navigate(['/login']);
  }

  redireccionHome(){
    this.router.navigate(['/']);

  }

  eliminarImagen(stringUrl: string){
    this.uploadImage.deleteImage(stringUrl).pipe(takeUntil(this.destroy$)).subscribe({

      next(value) {
        console.log("Foto borrada")
      },
      error(err) {
        console.log("No se ha podido borrar la foto")
      },
    })

  }

  eliminarUsuarioContratador(id: string){

    this.usuarioContService.deleteUsuarioContratadorByID(id).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        console.log("Usuario contratador eliminado")
      },
      error : (err) => {
        console.log("No se ha podido borrar la foto")
      }

    })
  }

  eliminarListaFavoritos(id: string){

    this.favService.deleteFavoritolById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next(value) {
        console.log("lista de favoritos eliminda");
      },
      error(err) {
        console.log("No se ha podido eliminar la lista de favoritos o la lista no existe.");
      },

    })
  }

  eliminarListaNotificaciones(id: string){

    this.listaNotServ.deleteListaNotificacioneslById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next(value) {
        console.log("lista de notificaciones eliminda");
      },
      error(err) {
        console.log("No se ha podido eliminar la lista de notificaciones o la lista no existe.");
      },

    })

  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

}


