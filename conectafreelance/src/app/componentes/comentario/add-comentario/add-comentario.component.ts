import { Component, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../../../utils/service/login-service.service';
import { DomSanitizer } from '@angular/platform-browser';
import { noWhitespaceValidator } from '../../../utils/ValidadoresPersonalizados';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { CommonModule } from '@angular/common';
import { ListComentarioContprofperfComponent } from "../list-comentario-contprofperf/list-comentario-contprofperf.component";
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';

@Component({
  selector: 'app-add-comentario',
  imports: [CommonModule, ReactiveFormsModule, ListComentarioContprofperfComponent],
  templateUrl: './add-comentario.component.html',
  styleUrl: './add-comentario.component.css'
})
export class AddComentarioComponent implements OnInit, OnDestroy{

  fotoCreador: string = " ";
  nombreUsu: string = " ";
  idCreador: string = " ";
  idDestinatario: string | null = " ";
  destroy$ = new Subject<void>();
  puntaje: number = 1;
  comentarioAAgregar!: Comentario;


  listaNotificaciones: ListaNotificaciones = {
    id: "",
    idDuenio: "",
    notificaciones: []

  };

  // event emitter para el puntaje del comentario
  @Output()
  puntajeAEmitir: EventEmitter<number> = new EventEmitter;

  // event emitter para eliminar el puntaje del comentario eliminado
  @Output()
  puntajeAEliminar: EventEmitter<number> = new EventEmitter;


  comentarioService = inject(ComentarioService);
  usuContService = inject(UsuarioContratadorService)
  fb = inject(FormBuilder);
  router = inject(Router);
  logServ = inject(LoginService);
  sanitizer = inject(DomSanitizer);
  activatedRoute = inject(ActivatedRoute);
  listNotService = inject(NotificacionService);


  formComentario = this.fb.nonNullable.group({
    idCreador: [" "],
    idDestinatario: [" ", [Validators.required]],
    nombreCreador: [" ", [Validators.required]],
    contenido: ["", [Validators.required, Validators.maxLength(500), noWhitespaceValidator()]],
    puntaje: [1, [Validators.required, Validators.min(1), Validators.max(5)]]

  });

  ngOnInit(): void {
    this.obtenerIdCreador();
    this.obtenerIdDEstinatario();
  }

  obtenerIdCreador(){

    this.idCreador = this.logServ.getId();
    this.getUsuContBDD();

  }

  getUsuContBDD(){

    this.usuContService.getUsuariosContratadoresPorId(this.idCreador).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuario) => {
          this.nombreUsu = usuario.nombreCompleto;
          this.fotoCreador = usuario.urlFoto;
          this.formComentario.patchValue({
            idCreador: this.idCreador,
            nombreCreador: this.nombreUsu,
          });

        },
        error: (err) => {
          console.error("No se pudo obtener el usuario: " + err);
        }
    });
  }

  obtenerIdDEstinatario(){

    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idDestinatario = param.get('id');
        if (!this.idDestinatario) {
          alert("Ha ocurrido un error. Será redirigido a su perfil.")
          this.router.navigate(['contratador/perfil']);
        }

        this.formComentario.patchValue({
          idDestinatario: this.idDestinatario as string
        });
      },
      error: (err) => {
        console.error('Error al obtener parámetros de la ruta:', err);
        this.router.navigate(['contratador/perfil']);
      },
    });
  }

  contentLength(): number {
    return this.formComentario.get('contenido')?.value?.length || 0;
  }


  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  agregarComentario() {

    if (this.formComentario.invalid) {
      alert("Formulario inválido");
      return;
    }

    const datosMinComentario = this.formComentario.getRawValue();

    const comentario = {
      ...datosMinComentario,
      puntaje: Number(datosMinComentario.puntaje),
      estado: "activa" as "activa",
      controlado: false,
      reportada: false
    };

    this.control(comentario);

  }

  addComentarioABDD(nvoComentario: Comentario){

    this.resetear();
    this.comentarioService.postComentario(nvoComentario).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        alert("Comentario enviado con éxito.");
        this.comentarioAAgregar = value;
        value.puntaje;
        this.puntajeAEmitir.emit(value.puntaje);
        this.emitirNotificacion(this.idDestinatario as string);
      },
      error : (err) => {
        alert("Error: no se ha podido enviar el comentario.");
        console.error("Error: " + err);
      },


    })
  }

  emitirNotificacion(id: string){

    this.listNotService.getListaNotificacionesPorIDUsuario(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) =>{
        if(value.length > 0){
          this.listaNotificaciones = value[0];
          const notificion: Notificacion = {
            descripcion: `El usuario ${this.nombreUsu} ha realizado un comentario`,
            leido: false

          }
          this.listaNotificaciones.notificaciones.push(notificion);
          this.putListaDeNotificaciones(this.listaNotificaciones);
        }
      }
    })
  }

  putListaDeNotificaciones(listaNotifMod: ListaNotificaciones){
    if(listaNotifMod.id){
      this.listNotService.putListaNotificaciones(listaNotifMod, listaNotifMod.id).pipe(takeUntil(this.destroy$)).subscribe({
        next : (value) => {
          console.log("Notificación emitida");
        },
        error : (err) => {
          console.error("Ha ocurrido un error al intentar emitir la notificación: " + err);
          alert("Error");
        },
      });
    }
  }

  resetear() {
    this.formComentario.get('contenido')?.setValue('');
  }

  control(nvoComentario: Comentario){

    this.comentarioService.getComentarioPorIDcreadorYDestinatario(this.idCreador, this.idDestinatario).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        if(value.length > 0 ){
          alert("Usted ya ha publicado un comentario.")
        }else{
          this.addComentarioABDD(nvoComentario);
        }

      },
      error : (err) => {

        alert("Ha ocurrido un error al interntar verificar si el usuario ya ha realizado un comentario")
      },

    })

  }

  puntAEliminar(puntaje: number){

    this.puntajeAEliminar.emit(puntaje);

  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


}
