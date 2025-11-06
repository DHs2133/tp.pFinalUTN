import { Component, inject } from '@angular/core';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { ChatService } from '../chatService/chat.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { UsuarioContratador } from '../../usuario/interfaceUsuario/usuario.interface';
import { Chat } from '../interfaceChat/chat.interface';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { CommonModule } from '@angular/common';
import { ListMensajeParaProfesionalComponent } from '../../mensaje/list-mensaje-para-profesional/list-mensaje-para-profesional.component';

@Component({
  selector: 'app-list-chats-para-profesional',
  imports: [CommonModule, ListMensajeParaProfesionalComponent],
  templateUrl: './list-chats-para-profesional.component.html',
  styleUrl: './list-chats-para-profesional.component.css'
})
export class ListChatsParaProfesionalComponent {

  loginService = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  chatService = inject(ChatService);
  activatedRoute = inject(ActivatedRoute);
  fb = inject(FormBuilder);
  router = inject(Router);
  usuContService = inject(UsuarioContratadorService)

  usuariosCont: UsuarioContratador[] = [];
  chats: Chat[] = [];
  chatParaCLM: Chat | null = null;
  chatsOrdenado: Chat[] = [];
  idSesion: string | null = null;
  idUsuNvoChat: string | null = null;
  imagenesPerfiles: { [key: string]: SafeUrl } = {};
  objectUrls: string[] = [];
  destroy$ = new Subject<void>();

  ngOnInit(): void {
    // Al iniciar el componente, se llama a la función para obtener el id de la sesión.
    this.obtenerIdSesion();
  }

  obtenerIdSesion() {
    // Se obtiene el id de la sesion
    this.idSesion = this.loginService.getId();// Si se obtiene, se procede a buscar los chats
    if (this.idSesion) {
      this.obtenerChats(this.idSesion as string);
    } else {
      alert('No se pudo obtener el ID de sesión. Será redirigido a su perfil');
      this.router.navigate(['/profesional/perfil']);
    }
  }

  obtenerChats(idSesion: string) {
    this.chatService.fetchChats(idSesion).pipe(takeUntil(this.destroy$)).subscribe({
      next: (chats) => {
        // Se encuentran los chats de este usuario
        this.chats = chats;
        const ids = this.chats
          .flatMap(ch => ch.idParticipantes) /// junta a todos los id en el array ids.
          .filter(id => id !== this.idSesion) /// se elimina a todos los id repetidos (los que coinciden con el id de sesión)
          // se llama a la función de buscar usuarios profesionales
          this.obtenerUsuariosProfesionales(ids);
      },
      error: (err) => {
        alert('Error al obtener los chats: ' + err);
      }
    });
  }

  obtenerUsuariosProfesionales(ids: string[]) {

    const userRequests = ids.map(id =>
      this.usuContService.getUsuariosContratadoresPorId(id).pipe(takeUntil(this.destroy$))
    );

    forkJoin(userRequests).subscribe({
      next: (usuarios) => {
        this.usuariosCont = usuarios;
        this.ordenarUsuariosYChatAlfabeticamente();

        this.usuariosCont.forEach(uc =>
          this.obtenerImagenesDelServidor(uc)
        )
      },
      error: (err) => {
        console.error('Error al obtener usuarios contratadores:', err);
      }
    });
  }

  ordenarUsuariosYChatAlfabeticamente() {
    this.usuariosCont.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
    this.ordenarChatsAlfabeticamente(this.usuariosCont);
  }

  ordenarChatsAlfabeticamente(usuariosCont: UsuarioContratador[]) {

    const ordenIds = usuariosCont.map(usuario => usuario.id);
    this.chatsOrdenado = this.chats
      .filter(chat => chat.idParticipantes.some(id => id !== this.idSesion))
      .map(chat => {
        const idOtro = chat.idParticipantes.find(id => id !== this.idSesion);
        return {
          ...chat,
          idParticipantes: idOtro ? [idOtro] : []
        };
      })
      .sort((a, b) => {
        const idOtroA = a.idParticipantes[0] || '';
        const idOtroB = b.idParticipantes[0] || '';
        return ordenIds.indexOf(idOtroA) - ordenIds.indexOf(idOtroB);
      }
      );
  }

  obtenerImagenesDelServidor(usuariosCont: UsuarioContratador) {

    if (usuariosCont.urlFoto) {
      const urlFoto = usuariosCont.urlFoto;
      this.imageService.getImagen(urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrls.push(objectUrl);
          this.imagenesPerfiles[urlFoto] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: (err) => {
          console.error(`Error al cargar la imagen de perfil ${urlFoto}:`, err);
        }
      });
    }
  }


  getNombreUsuario(chat: Chat): string {
    const idOtro = chat.idParticipantes.find(id => id !== this.idSesion);
    const usuario = this.usuariosCont.find(u => u.id === idOtro);
    return usuario ? usuario.nombreCompleto : 'Usuario desconocido';
  }

  getUltimoMensaje(chat: Chat): string {
    const ultimoMensaje = chat.mensajes[chat.mensajes.length - 1];
    return ultimoMensaje ? ultimoMensaje.contenido : 'No hay mensajes.';
  }

  getMensajesNoLeidosCount(chat: Chat): number {
    const idOtro = chat.idParticipantes[0];
    return chat.mensajes.filter(mensaje => !mensaje.leido && mensaje.idCreador === idOtro).length;
  }

  getUsuContFoto(id: string): string{
    const usuario = this.usuariosCont.find(uc => uc.id === id);
    if(usuario){
      return usuario.urlFoto
    }else{
      return ""
    }

  }


  seleccionarChat(chat: Chat){
    this.chatsOrdenado.forEach(c => {
      if(c.id === chat.id){
        c.mensajes.forEach(m =>
        {
          if(m.idCreador !== this.idSesion){
            m.leido = true;
          }
        }
        )
      }
    })

    if(!chat.idParticipantes.find(id => id === this.idSesion)){
      chat.idParticipantes.push(this.idSesion as string);
    }
    chat.mensajes.forEach(m =>
        {

          if(m.idCreador !== this.idSesion){
            m.leido = true;
          }
        }
      )

    if(chat.id){
      this.chatService.putChat(chat, chat.id).pipe(takeUntil(this.destroy$)).subscribe({
        next : (value) =>{
        },
        error(err) {
          alert("No se ha podido marcar el mensaje como visualizado");
        },
      })
    }
    this.chatParaCLM = chat;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imagenesPerfiles = {};
  }

}
