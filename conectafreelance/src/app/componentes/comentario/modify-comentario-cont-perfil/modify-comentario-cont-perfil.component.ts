import { Component, inject } from '@angular/core';
import { catchError, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
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
          this.cargarDatosCompletos(this.idComentario);
        }
      },
      error: () => {
        this.router.navigate(['contratador/perfil']);
      }
    });
  }

  cargarDatosCompletos(idComentario: string): void {
    this.comentarioService.getComentarioPorIDcomentario(idComentario)
      .pipe(
        takeUntil(this.destroy$),
        switchMap((comentario) => {
          this.comentarioAModificar = comentario;
          this.formularioDefecto();
          return this.usuarioContServ.getUsuariosContratadoresPorId(comentario.idCreador);
        }),
        catchError((err) => {
          console.error('Error al cargar comentario o usuario:', err);
          alert('No se pudo cargar la información necesaria');
          this.router.navigate(['contratador/perfil']);
          return of(null);
        })
      )
      .subscribe({
        next: (usuario) => {
          if (usuario) {
            this.usuarioContSesion = usuario;
            console.log('Usuario cargado correctamente:', this.usuarioContSesion.nombreCompleto);
          } else {
            alert('No se encontró el usuario creador del comentario');
            this.router.navigate(['contratador/perfil']);
          }
        }
      });
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

    if (!this.idComentario) {
      alert('ID del comentario no encontrado');
      this.router.navigate(['contratador/perfil']);
      return;
    }

    const datosActualizados = this.formulario.getRawValue();

    const contenidoOriginal = this.comentarioAModificar.contenido;
    let haCambiado;
    if(contenidoOriginal === datosActualizados.contenido){
      haCambiado = false
    }else{
      haCambiado = true

    }


    if(haCambiado){
      this.comentarioService.putComentario(datosActualizados, this.idComentario)
        .pipe(
          tap(() => alert('Comentario modificado con éxito')),
          switchMap((comentarioActualizado) =>

            this.listaNotifServ.getListaNotificacionesPorIDUsuario(comentarioActualizado.idDestinatario).pipe(
              switchMap((listas) => {
                if (listas.length === 0) {
                  console.warn('El destinatario no tiene lista de notificaciones');
                  return of(null);
                }

                const listaNotif = listas[0];
                if (!listaNotif.notificaciones) {
                  listaNotif.notificaciones = [];
                }

                const nuevaNotif: Notificacion = {
                  descripcion: `El usuario ${this.usuarioContSesion.nombreCompleto} ha modificado un comentario sobre ti`,
                  leido: false
                };

                listaNotif.notificaciones.push(nuevaNotif);

                return this.listaNotifServ.putListaNotificaciones(listaNotif, listaNotif.id!).pipe(takeUntil(this.destroy$));
              }),
              catchError((err) => {
                console.warn('Error al enviar notificación (se ignora):', err);
                return of(null);
              })
            )
          ),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: () => {
            this.router.navigate(['contratador/perfil']);
          },
          error: (err) => {
            console.error('Error crítico al actualizar comentario:', err);
            alert('Error al modificar el comentario');
            this.router.navigate(['contratador/perfil']);
          }
        });
      }else{
        this.router.navigate(['contratador/perfil']);

      }
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
