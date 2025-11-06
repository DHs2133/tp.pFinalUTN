import { Component, inject } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { noWhitespaceValidator } from '../../../utils/ValidadoresPersonalizados';
import { CommonModule } from '@angular/common';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { UsuarioContratador } from '../../usuario/interfaceUsuario/usuario.interface';

@Component({
  selector: 'app-modify-comentario-cont-perfil',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modify-comentario-cont-perfil.component.html',
  styleUrl: './modify-comentario-cont-perfil.component.css'
})
export class ModifyComentarioContPerfilComponent {

  // Variables
  usuarioContSesion!: UsuarioContratador
  idComentario: string | null = null;
  destroy$ = new Subject<void>();
  comentarioAModificar!: Comentario;

  // Servicios
  activatedRoute = inject(ActivatedRoute);
  usuarioContServ = inject(UsuarioContratadorService);
  fb = inject(FormBuilder);
  comentarioService = inject(ComentarioService);
  router = inject(Router);
  listaNotifServ = inject(NotificacionService);

  // Formulario
  formulario = this.fb.nonNullable.group({

    id: ['', [Validators.required]],
    idCreador: ['', [Validators.required]],
    idDestinatario: ['', [Validators.required]],
    contenido: ['', [Validators.required, Validators.maxLength(500), noWhitespaceValidator()]],
    estado: ['activa' as "activa", [Validators.required]],
    reportada: [false, [Validators.required]],
    controlado: [false, [Validators.required]],
    puntaje: [0, [Validators.required]]

  });

  ngOnInit(): void {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idComentario = param.get('id');
        if (this.idComentario) {

          this.getComentarioById(this.idComentario);
          this.obtenerIdUsuarioSesion();
        }
      },
      error: (err) => {
        console.error('Error al obtener el id del comentario:', err);
        this.router.navigate(['contratador/perfil']);
      },
    });
  }

  obtenerIdUsuarioSesion(){
    const id = this.comentarioAModificar.idCreador;

    if(id){
      this.obtenerUsuarioSesion(id);
    }else{
      alert("No se ha podido obtener el id del usuario de sesión");
      this.router.navigate(['contratador/perfil']);
    }
  }

  obtenerUsuarioSesion(idUsuario: string){
    this.usuarioContServ.getUsuariosContratadoresPorId(idUsuario).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        if(value){
          this.usuarioContSesion = value;
        }else{
          alert("No se ha podido obtener la información del usuario de sesión");
          this.router.navigate(['contratador/perfil']);

        }
      },
      error : (err) => {
        alert("No se ha podido obtener los datos del usuario contratador. Será redirigido a su perfil");
      },
    })

  }


  getComentarioById(idComentario: string) {
    this.comentarioService.getComentarioPorIDcomentario(idComentario).pipe(takeUntil(this.destroy$)).subscribe({
      next: (coment) => {
        this.comentarioAModificar = coment;
        console.log(this.comentarioAModificar)
        this.formularioDefecto();

      },
      error: (err) => {
        alert('No se pudo obtener el comentario a modificar. Será redirigido');
        console.error('Error al obtener el comentario:', err);
        this.router.navigate(['contratador/perfil']);
      },
    });
  }

  formularioDefecto() {
    if (this.comentarioAModificar) {
      this.formulario.patchValue({
        id: this.comentarioAModificar.id,
        idCreador: this.comentarioAModificar.idCreador,
        idDestinatario: this.comentarioAModificar.idDestinatario,
        contenido: this.comentarioAModificar.contenido,
        reportada: this.comentarioAModificar.reportada,
        controlado: this.comentarioAModificar.controlado,
        puntaje: this.comentarioAModificar.puntaje

      });
    }
  }

  reestablecer() {
    this.formulario.patchValue({
      contenido: this.comentarioAModificar.contenido,
    });
  }

  update() {
    if (this.formulario.invalid) {
      alert('Formulario inválido');
      return;
    }

    const datos = this.formulario.getRawValue();

    this.updateComentario(datos);
  }

  updateComentario(comModificada: Comentario) {
    if (this.idComentario) {
      this.comentarioService.putComentario(comModificada, this.idComentario).pipe(takeUntil(this.destroy$)).subscribe({
        next: (value) => {
          alert('Comentario modificado con éxito');
          this.obtenerListaDeNotificacionesDeDestinatario(value.idDestinatario);
        },
        error: (err) => {
          alert('El comentario no ha podido ser modificado');
          console.error('Error al modificar el comentario:', err);
        },
      });
    }
  }


  obtenerListaDeNotificacionesDeDestinatario(idProf: string){
    this.listaNotifServ.getListaNotificacionesPorIDUsuario(idProf).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        if(value.length > 0){
          const listaNotif = value[0]
          this.emitirNotificación(listaNotif);

        }else{
          alert("No se ha podido obtener la lista de favoritos del destinatario del comentario. Será redirigido a su perfil");
          this.router.navigate(['contratador/perfil']);
        }
      },
      error: (err) => {
        alert("No se ha podido obtener la lista de favoritos del destinatario del comentario. Será redirigido a su perfil");
        this.router.navigate(['contratador/perfil']);
      },
    })
  }

  emitirNotificación(listaNot: ListaNotificaciones){


    const nvaNotificacion: Notificacion = {

      descripcion: `El usuario: ${this.usuarioContSesion.nombreCompleto} ha modificado su comentario`,
      leido: false

    }
      alert("HOLAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")


    listaNot.notificaciones.push(nvaNotificacion);

    this.actualizarListaNotificacion(listaNot);


  }


  actualizarListaNotificacion(listaNot: ListaNotificaciones){
    this.listaNotifServ.putListaNotificaciones(listaNot, listaNot.id as string).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        alert("Se ha enviado exitosamente la notificación al usuario destinatario ");
        this.router.navigate(['contratador/perfil']);

      },
      error : (err) => {
        alert("No se ha enviado exitosamente la notificación al usuario destinatario ");

      },

    })
  }






  contentLength(): number {
    return this.formulario.get('contenido')?.value?.length || 0;
  }


  restrictLength(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    if (input.value.length > 500) {
      input.value = input.value.slice(0, 500);
      this.formulario.get('contenido')?.setValue(input.value);
      this.formulario.get('contenido')?.markAsTouched();
    }
  }

  autoResize(event: Event) {
    const texpublicacion = event.target as HTMLTextAreaElement;
    texpublicacion.style.height = 'auto';
    texpublicacion.style.height = `${texpublicacion.scrollHeight}px`;
  }




  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


}
