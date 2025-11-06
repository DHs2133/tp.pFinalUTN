import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioContratador } from '../../usuario/interfaceUsuario/usuario.interface';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { forkJoin, of, Subject, switchMap, takeUntil } from 'rxjs';
import { ChatService } from '../../chat/chatService/chat.service';
import { Chat } from '../../chat/interfaceChat/chat.interface';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { ComentarioService } from '../../comentario/serviceComentario/comentario.service';
import { Comentario } from '../../comentario/interfaceComentario/interface-comentario';
import { FavoritoService } from '../../favoritos/serviceFavorito/favorito.service';

@Component({
  selector: 'app-navbar-contratador-component',
  imports: [RouterModule],
  templateUrl: './navbar-contratador-component.component.html',
  styleUrl: './navbar-contratador-component.component.css'
})
export class NavbarContratadorComponentComponent implements OnInit, OnDestroy {


  id: string = '';
  imagenUrl: SafeUrl | null = null;
  usuCont!: UsuarioContratador;
  isDropdownOpen = false;
  isDropdownOpenNotif = false;
  notificacionesNoLeidas = 0;
  mensajesNoLeidos = 0;
  notificaciones: Notificacion[] = [];
  listaNotificaciones: ListaNotificaciones | null = null;



  usuContService = inject(UsuarioContratadorService);
  router = inject(Router);
  loginService = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  chatService = inject(ChatService);
  listNotService = inject(NotificacionService);
  comentarioService = inject(ComentarioService);
  favoritoService = inject(FavoritoService);
  destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.id = this.loginService.getId();
    if (this.id) {
      this.obtenerContDeBDD(this.id);
      this.cargarNotificaciones(this.id);
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }




  obtenerContDeBDD(id: string) {
    this.usuContService.getUsuariosContratadoresPorId(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        this.usuCont = value;
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


  cargarNotificaciones(id: string) {

    this.cantMensajesNoLeidos(id);
    this.inicializarNotificaciones(id);
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

  cantMensajesNoLeidos(idUsuario: string) {

    this.chatService.fetchMensajesNoLeidos(idUsuario);
    this.chatService.mensajesNoLeidos$
      .pipe(takeUntil(this.destroy$))
      .subscribe(count => {
        this.mensajesNoLeidos = count;
        console.log('Mensajes no leídos:', count);
      });
  }





  cerrarSesion() {
    this.loginService.clear();
    this.router.navigate(['/home']);
    this.isDropdownOpen = false;
  }

  modificarCuenta() {
    this.router.navigate([`/contratador/modPerCont/${this.id}`]);
    this.isDropdownOpen = false;
  }

  eliminarCuenta() {
    const confirmado = window.confirm('¿Estás seguro de que querés eliminar tu cuenta?');
    if (!confirmado) {
      this.isDropdownOpen = false;
      return;
    }

    forkJoin({
      comentarios: this.comentarioService.getComentarioPorIDcreador(this.id),
      chats: this.chatService.deleteChatsPorUsario(this.id),
      listaFav: this.favoritoService.getFavoritoPorIDCreador(this.id),

      listaNotif: this.listNotService.getListaNotificacionesPorIDUsuario(this.id)
    }).pipe(
      takeUntil(this.destroy$),
      switchMap(({ comentarios, listaNotif, listaFav}) => {

        const deleteComs$ = comentarios.length > 0
          ? forkJoin(comentarios.map(c => this.comentarioService.eliminarComentario(c.id as string)))
          : of([]);

        const deleteFav$ = listaFav.length > 0
        ? this.favoritoService.deleteFavoritolById(listaFav[0].id as string)
        : of(null);

        const deleteNotif$ = listaNotif.length > 0
          ? this.listNotService.deleteListaNotificacioneslById(listaNotif[0].id as string)
          : of(null);

        const deleteFotoPerfil$ = this.usuCont.urlFoto
          ? this.imageService.deleteImage(this.usuCont.urlFoto)
          : of(null);

        return forkJoin({
          comentarios: deleteComs$,
          favoritos: deleteFav$,
          notificaciones: deleteNotif$,
          fotoPerfil: deleteFotoPerfil$
        });
      }),

      switchMap(() => this.usuContService.deleteUsuarioContratadorByID(this.id))
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
        this.loginService.clear();
        this.router.navigate(['/home']);
      }
    });

    this.isDropdownOpen = false;
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



}
