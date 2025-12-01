import { Component, inject, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { catchError, of, Subject, switchMap, takeUntil, tap } from 'rxjs';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { noWhitespaceValidator } from '../../../utils/ValidadoresPersonalizados';
import { CommonModule } from '@angular/common';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { UsuarioContratador } from '../../usuario/interfaceUsuario/usuario.interface';

@Component({
  selector: 'app-modify-comentario',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modify-comentario.component.html',
  styleUrl: './modify-comentario.component.css'
})
export class ModifyComentarioComponent implements OnInit, OnDestroy {


  idComentario: string | null = null;
  destroy$ = new Subject<void>();
  comentarioAModificar!: Comentario;
  usuarioContSesion!: UsuarioContratador;
  hayModificacion: boolean = false;

  // Servicios
  activatedRoute = inject(ActivatedRoute);
  fb = inject(FormBuilder);
  comentarioService = inject(ComentarioService);
  router = inject(Router);
  listaNotifServ = inject(NotificacionService);
  usuarioContServ = inject(UsuarioContratadorService);

  formulario = this.fb.nonNullable.group({
    id: ['', [Validators.required]],
    idCreador: ['', [Validators.required]],
    idDestinatario: ['', [Validators.required]],
    contenido: ['', [Validators.required, Validators.maxLength(500), noWhitespaceValidator()]],
    estado: ['activa' as "activa", [Validators.required]],
    reportada: [false, [Validators.required]],
    puntaje: [0, [Validators.required]],
  });

  ngOnInit(): void {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idComentario = param.get('idComentario');
        if (this.idComentario) {
          this.cargarDatosIniciales(this.idComentario);
        } else {
          this.router.navigate(['contratador/perfilProfesional']);
        }
      }
    });
  }

  cargarDatosIniciales(idComentario: string): void {
    this.comentarioService.getComentarioPorIDcomentario(idComentario)
      .pipe(
        takeUntil(this.destroy$),
        tap(coment => {
          this.comentarioAModificar = coment;
          this.formularioDefecto(coment);
        }),
        switchMap(coment => this.usuarioContServ.getUsuariosContratadoresPorId(coment.idCreador)),
        catchError(err => {
          console.error('Error al cargar comentario o usuario:', err);
          alert('No se pudo cargar la información necesaria');
          this.router.navigate(['contratador/perfilProfesional']);
          return of(null);
        })
      )
      .subscribe({
        next: (usuario) => {
          if (usuario) {
            this.usuarioContSesion = usuario;
          }
        }
      });
  }

  formularioDefecto(comentario: Comentario) {
    this.formulario.patchValue({
      id: comentario.id,
      idCreador: comentario.idCreador,
      idDestinatario: comentario.idDestinatario,
      contenido: comentario.contenido,
      reportada: comentario.reportada,
      puntaje: comentario.puntaje,
    });
  }

  reestablecer() {
    this.formulario.patchValue({
      contenido: this.comentarioAModificar.contenido
    });

  }




  update() {
    if (this.formulario.invalid || !this.idComentario) {
      alert('Formulario inválido o comentario no encontrado');
      return;
    }

    const datos = this.formulario.getRawValue();
    const comentario: Comentario = {
      ...datos,
      controlado: false
    };

    const contenidoOriginal = this.comentarioAModificar.contenido;
    let haCambiado;
    if(contenidoOriginal === datos.contenido){
      haCambiado = false
    }else{
      haCambiado = true

    }

    if(haCambiado){
      this.comentarioService.putComentario(comentario, this.idComentario)
        .pipe(
          tap(() => alert('Comentario modificado con éxito')),
          switchMap((comentarioActualizado) =>
            this.listaNotifServ.getListaNotificacionesPorIDUsuario(comentarioActualizado.idDestinatario).pipe(
              switchMap((listas) => {
                if (listas.length === 0) {
                  console.warn('El destinatario no tiene lista de notificaciones');
                  return of(null);
                }

                const lista = listas[0];
                if (!lista.notificaciones) lista.notificaciones = [];

                const notif: Notificacion = {
                  descripcion: `El usuario ${this.usuarioContSesion?.nombreCompleto || 'Alguien'} ha modificado un comentario sobre ti`,
                  leido: false
                };

                lista.notificaciones.push(notif);

                return this.listaNotifServ.putListaNotificaciones(lista, lista.id!);
              }),
              catchError(err => {
                console.warn('Error al enviar notificación (se ignora):', err);
                return of(null);
              })
            )
          ),
          takeUntil(this.destroy$)
        )
        .subscribe({
          next: () => {

            this.router.navigate(['contratador/contprofperfil', this.comentarioAModificar.idDestinatario]);
          },
          error: (err) => {
            console.error('Error al modificar comentario:', err);
            alert('Error al modificar el comentario');
            this.router.navigate(['contratador/contprofperfil', this.comentarioAModificar.idDestinatario]);
          }
        });
      }else{
        this.router.navigate(['contratador/contprofperfil', this.comentarioAModificar.idDestinatario]);

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
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
