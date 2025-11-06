import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { Chat } from '../interfaceChat/chat.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { ChatService } from '../chatService/chat.service';
import { forkJoin, Subject, takeUntil } from 'rxjs';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ListMensajeComponent } from "../../mensaje/list-mensaje/list-mensaje.component";
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lista-chats',
  imports: [ListMensajeComponent, CommonModule],
  templateUrl: './lista-chats.component.html',
  styleUrl: './lista-chats.component.css'
})

export class ListaChatsComponent implements OnInit, OnDestroy {

  loginService = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  usuProfService = inject(UsuarioProfesionalService);
  chatService = inject(ChatService);
  activatedRoute = inject(ActivatedRoute);
  fb = inject(FormBuilder);
  router = inject(Router);

  usuariosProf: UsuarioProfesional[] = [];
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
      this.router.navigate(['/contratador/perfil']);
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
      this.usuProfService.getUsuariosProfesionalPorID(id).pipe(takeUntil(this.destroy$))
    );

    forkJoin(userRequests).subscribe({
      next: (usuarios) => {
        this.usuariosProf = usuarios;
        this.ordenarUsuariosYChatAlfabeticamente();

        this.usuariosProf.forEach(up =>
          this.obtenerImagenesDelServidor(up)
        )
      },
      error: (err) => {
        console.error('Error al obtener usuarios profesionales:', err);
      }
    });
  }

  ordenarUsuariosYChatAlfabeticamente() {
    this.usuariosProf.sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto));
    this.ordenarChatsAlfabeticamente(this.usuariosProf);
  }

  ordenarChatsAlfabeticamente(usuariosProf: UsuarioProfesional[]) {
    const ordenIds = usuariosProf.map(usuario => usuario.id);
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
      });
  }

  obtenerImagenesDelServidor(usuProf: UsuarioProfesional) {

    if (usuProf.urlFoto) {
      const urlFoto = usuProf.urlFoto;
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
    const usuario = this.usuariosProf.find(u => u.id === idOtro);
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

  getUsuProFoto(id: string): string{
    const usuario = this.usuariosProf.find(up => up.id === id);
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

