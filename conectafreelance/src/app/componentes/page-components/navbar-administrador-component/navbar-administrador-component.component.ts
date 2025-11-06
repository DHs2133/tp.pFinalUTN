import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioAdministrador } from '../../usuario/interfaceUsuario/usuario.interface';
import { ListaNotificaciones, Notificacion } from '../../notificacion/interfaceNotificacion/notificacion.interface';
import { UsuarioAdministradorService } from '../../usuario/usuarioAdmin/service/usuario-administrador.service';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ChatService } from '../../chat/chatService/chat.service';
import { NotificacionService } from '../../notificacion/notificacionService/notificacion.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navbar-administrador-component',
  imports: [RouterModule],
  templateUrl: './navbar-administrador-component.component.html',
  styleUrl: './navbar-administrador-component.component.css'
})
export class NavbarAdministradorComponentComponent {

  id: string = '';
  imagenUrl: SafeUrl | null = null;
  usuAdmt!: UsuarioAdministrador;
  isDropdownOpen = false;
  isDropdownOpenNotif = false;
  notificacionesNoLeidas = 0;
  mensajesNoLeidos = 0;
  notificaciones: Notificacion[] = [];
  listaNotificaciones: ListaNotificaciones | null = null;


  usuAdmService = inject(UsuarioAdministradorService);
  router = inject(Router);
  loginService = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  chatService = inject(ChatService);
  listNotService = inject(NotificacionService);
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
    this.usuAdmService.getUsuariosAdministradoresPorID(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        this.usuAdmt = value;
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






  cerrarSesion() {
    this.loginService.clear();
    this.router.navigate(['/home']);
    this.isDropdownOpen = false;
  }

  modificarCuenta() {
    this.router.navigate([`/admin/modPerAdm/${this.id}`]);
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
