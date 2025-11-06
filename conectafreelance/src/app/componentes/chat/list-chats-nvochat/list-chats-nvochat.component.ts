import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { ChatService } from '../chatService/chat.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@angular/forms';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { Chat } from '../interfaceChat/chat.interface';
import { forkJoin, map, Subject, takeUntil } from 'rxjs';
import { Mensaje } from '../../mensaje/interface-mensaje/interface-mensaje';
import { ListMensajeComponent } from '../../mensaje/list-mensaje/list-mensaje.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-chats-nvochat',
  imports: [CommonModule, ListMensajeComponent],
  templateUrl: './list-chats-nvochat.component.html',
  styleUrl: './list-chats-nvochat.component.css'
})
export class ListChatsNvochatComponent implements OnInit, OnDestroy{

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

  //chat para componente lista mensajes
  chatParaCLM: Chat | null = null;

  chatsOrdenado: Chat[] = [];
  idSesion: string | null = null;
  idUsuNvoChat: string | null = null;
  imagenesPerfiles: { [key: string]: SafeUrl } = {};
  objectUrls: string[] = [];
  destroy$ = new Subject<void>();

  formChat = this.fb.nonNullable.group({
    idParticipantes: [[] as string[]],
    mensajes: [[] as Mensaje[]],
  });

  ngOnInit(): void {
    // funcion para obtener el id del usuario logueado
    this.obtenerIdSesion();
  }

  obtenerIdSesion() {
    // Se obtiene el id de la sesion
    this.idSesion = this.loginService.getId();// Si se obtiene, se procede a buscar los chats
    if (this.idSesion) {

      this.obtenerIdUsuProf();

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



  obtenerIdUsuProf() {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (params) => {
        //En caso de que se utilice el path con id, se obtiene el mismo.
        this.idUsuNvoChat = params.get('idProf');
        //Si se obtiene un id porque se utiliza el path con id
        if (this.idUsuNvoChat) {
          //Se llama a la funcion para obtener los chats del usuario logueado.
          this.crearChat(this.idSesion as string, this.idUsuNvoChat);
        } else {

          alert('No se pudo obtener el ID del usuario profesional. Será redirigido a su perfil');
          this.router.navigate(['contratador/perfilContratador']);

        }
      },
      error: (err) => {
        alert('Error al obtener parámetros de la ruta:' + err);
      }
    });
  }

  crearChat(idSesion: string, idUsuProf: string) {

    // se establecen los id de los dos participantes
    this.formChat.patchValue({
      idParticipantes: [idSesion, idUsuProf],
      mensajes: []
    });

    // si el formulario es valido
    if (this.formChat.valid) {
      // se pasan los valores del formulario
      const nvoChat = this.formChat.getRawValue();
      // y se llama a la función para guardar el chat
      this.guardarNvoChat(nvoChat);
    } else {
      alert('Formulario de chat no válido');
    }
  }

  guardarNvoChat(nvoChat: Chat) {

    this.chatService.postChat(nvoChat).pipe(takeUntil(this.destroy$)).subscribe({
      next: (chatCreado) => {
        // se guarda el nuevo chat y se lo guarda en el array de chats del usuario
        this.chats.push(chatCreado);
        this.obtenerChats(this.idSesion as string);

      },
      error: (err) => {
        alert('Error al crear el chat:' + err);
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


  getusuProf(id: string): string{
    const usuario = this.usuariosProf.find(up => up.id === id);
    if(usuario){
      return usuario.urlFoto
    }else{
      return ""
    }

  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imagenesPerfiles = {};
  }

}
