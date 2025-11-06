import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { LoginService } from '../../../utils/service/login-service.service';
import { Router, RouterModule } from '@angular/router';
import { concatMap, forkJoin, from, of, Subject, switchMap, takeUntil } from 'rxjs';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { ImageService } from '../../../service/back-end/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { ChatService } from '../../chat/chatService/chat.service';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { PublicacionService } from '../../publicacion/servicePublicacion/publicacion.service';
import { Publicacion } from '../../publicacion/interfacePublicacion/publicacion.interface';
import { ComentarioService } from '../../comentario/serviceComentario/comentario.service';
import { Comentario } from '../../comentario/interfaceComentario/interface-comentario';

@Component({
  selector: 'app-navbar-profesional-component',
  imports: [RouterModule],
  templateUrl: './navbar-profesional-component.component.html',
  styleUrl: './navbar-profesional-component.component.css'
})
export class NavbarProfesionalComponentComponent implements OnInit, OnDestroy{



  id: string = '';
  imagenUrl: SafeUrl | null = null;
  usuProf!: UsuarioProfesional;
  isDropdownOpen = false;
  isDropdownOpenNotif = false;
  notificacionesNoLeidas = 0;
  mensajesNoLeidos = 0;
  notificaciones: Notificacion[] = [];
  listaNotificaciones: ListaNotificaciones | null = null;

  usuProfService = inject(UsuarioProfesionalService);
  router = inject(Router);
  loginService = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  chatService = inject(ChatService);
  listNotService = inject(NotificacionService);
  publicacionesService = inject(PublicacionService);
  comentarioService = inject(ComentarioService);
  destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.id = this.loginService.getId();
    if (this.id) {
      this.obtenerProfDeBDD(this.id);
      this.cargarNotificaciones(this.id);
    }
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


  obtenerProfDeBDD(id: string) {
    this.usuProfService.getUsuariosProfesionalPorID(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        this.usuProf = value;
        this.obtenerImagenPerfil(value.urlFoto);
      },
      error: (err) => {
        alert('Ha ocurrido un error al cargar el componente navbar.');
        console.error('Error:', err);
      }
    });
  }

  obtenerImagenPerfil(nombreFoto: string) {
    this.imageService.getImagen(nombreFoto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        console.error('Error al cargar la imagen:', err);
        alert('Error al cargar la imagen');
      }
    });
  }



  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleDropdownNotif(){

    this.isDropdownOpenNotif = !this.isDropdownOpenNotif
    if(!this.isDropdownOpenNotif){
      this.marcarNotificacionesComoLeidas();
    }

  }

  cerrarSesion() {
    this.loginService.clear();
    this.router.navigate(['/home']);
    this.isDropdownOpen = false;
  }

  modificarCuenta() {
    this.router.navigate([`/profesional/modPerProf/${this.id}`]);
    this.isDropdownOpen = false;
  }


  eliminarCuenta() {
    const confirmado = window.confirm('¿Estás seguro de que querés eliminar tu cuenta?');
    if (!confirmado) {
      this.isDropdownOpen = false;
      return;
    }

    forkJoin({
      publicaciones: this.publicacionesService.getPublicacionesPorIDcreador(this.id),
      comentarios: this.comentarioService.getComentarioPorIDdestinatario(this.id),
      chats: this.chatService.deleteChatsPorUsario(this.id),
      listaNotif: this.listNotService.getListaNotificacionesPorIDUsuario(this.id)
    }).pipe(
      takeUntil(this.destroy$),
      switchMap(({ publicaciones, comentarios, listaNotif }) => {

        const fotosPubNombres = publicaciones
          .filter(p => p.urlFoto)
          .map(p => p.urlFoto!);

        const deleteFotosPubs$ = fotosPubNombres.length > 0
          ? from(fotosPubNombres).pipe(
              concatMap(nombre => this.imageService.deleteImage(nombre))
            )
          : of(null);

        const deletePubs$ = publicaciones.length > 0
          ? forkJoin(publicaciones.map(p => this.publicacionesService.eliminarPublicacion(p.id as string)))
          : of([]);

        const deleteComs$ = comentarios.length > 0
          ? forkJoin(comentarios.map(c => this.comentarioService.eliminarComentario(c.id as string)))
          : of([]);

        const deleteNotif$ = listaNotif.length > 0
          ? this.listNotService.deleteListaNotificacioneslById(listaNotif[0].id as string)
          : of(null);

        const deleteFotoPerfil$ = this.usuProf.urlFoto
          ? this.imageService.deleteImage(this.usuProf.urlFoto)
          : of(null);

        return forkJoin({
          fotosPubs: deleteFotosPubs$,
          pubs: deletePubs$,
          coms: deleteComs$,
          notif: deleteNotif$,
          fotoPerfil: deleteFotoPerfil$
        });
      }),

      switchMap(() => this.usuProfService.deleteUsuarioProfesionalById(this.id))
    ).subscribe({
      next: () => {
        this.loginService.clear();
        this.router.navigate(['/home']).then(() => {
          alert('Cuenta eliminada exitosamente.');
        });
      },
      error: (err) => {
        console.error('Error completo en eliminación de cuenta:', err);
        alert('Error al eliminar la cuenta. Algunos datos pueden persistir.');
        this.router.navigate(['/home']);
      }
    });

    this.isDropdownOpen = false;
  }



  cargarNotificaciones(id: string) {

    this.cantMensajesNoLeidos(id);
    this.inicializarNotificaciones(id);
  }

  cantMensajesNoLeidos(idUsuario: string) {

    this.chatService.fetchMensajesNoLeidos(idUsuario);
    this.chatService.mensajesNoLeidos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.mensajesNoLeidos = count;
        console.log('Mensajes no leídos:', count);
      });
  }


  inicializarNotificaciones(idSesion: string) {
    this.listNotService.getListaNotificacionesPorIDUsuario(idSesion).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        console.log('Notificaciones recibidas:', value);
        if (value.length > 0) {
          this.listaNotificaciones = value[0];
          this.notificaciones = (this.listaNotificaciones.notificaciones || []).slice().reverse();;
        } else {
          this.notificaciones = [];
        }
        this.cantNotificacionesNoLeidas();
      },
      error: (err) => {
        console.error('Error al cargar notificaciones:', err);
        this.notificaciones = [];
      }
    });
  }

  cantNotificacionesNoLeidas(){
    this.notificacionesNoLeidas = this.notificaciones.reduce(
      (acum, n) => acum + (!n.leido ? 1 : 0),
      0
    );
  }




  marcarNotificacionesComoLeidas(){

    if(this.notificacionesNoLeidas > 0 && this.listaNotificaciones){
      this.listaNotificaciones.notificaciones.forEach(n =>{
        if(!n.leido){
          n.leido = true;
        }
      })

      this.actualizarListaDeNotificaciones(this.listaNotificaciones);
      this.notificaciones = this.listaNotificaciones.notificaciones;
      this.notificacionesNoLeidas = 0;
      this.cantNotificacionesNoLeidas();
    }
  }

  actualizarListaDeNotificaciones(listaNotificaciones: ListaNotificaciones){
    this.listNotService.putListaNotificaciones(listaNotificaciones, listaNotificaciones.id as string).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        console.error("lista actualizada con exito.");
      },
      error(err) {
        console.error("No se pudo actualizar la lista.");

      },
    })
  }


}
