import { Component, inject, OnInit } from '@angular/core';
import { UsuarioContratador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { Chat } from '../interfaceChat/chat.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { ChatService } from '../chatService/chat.service';

@Component({
  selector: 'app-lista-chats',
  imports: [],
  templateUrl: './lista-chats.component.html',
  styleUrl: './lista-chats.component.css'
})
export class ListaChatsComponent implements OnInit {

  usuariosProf: UsuarioProfesional[] = [];
  chats: Chat[] = [];
  idSesion: string | null = null;
  imagenPublicacion: { [key: string]: SafeUrl } = {};

  loginService = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  usuProfService = inject(UsuarioProfesionalService);
  chatService = inject(ChatService);

  ngOnInit(): void {

    this.idSesion = this.loginService.getId();


  }

  obtenerChatUsuario(){



  }

  obtenerUsuariosProfesionales(){
    this.usuProfService.getNombreUsuarioProfesionalPorID

  }




}
