import { Component, inject, Input, SimpleChanges } from '@angular/core';
import { UsuarioContratador } from '../../usuario/interfaceUsuario/usuario.interface';
import { Subject, takeUntil } from 'rxjs';
import { Chat } from '../../chat/interfaceChat/chat.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ChatService } from '../../chat/chatService/chat.service';
import { Mensaje } from '../interface-mensaje/interface-mensaje';
import { NgClass } from '@angular/common';
import { AddMensajeComponent } from '../add-mensaje/add-mensaje.component';

@Component({
  selector: 'app-list-mensaje-para-profesional',
  imports: [NgClass, AddMensajeComponent ],
  templateUrl: './list-mensaje-para-profesional.component.html',
  styleUrl: './list-mensaje-para-profesional.component.css'
})
export class ListMensajeParaProfesionalComponent {


  usuarioContratador!:UsuarioContratador
  idSesion: string = "";
  idDestinatario: string | null = null;
  destroy$ = new Subject<void>();
  @Input()
  chat: Chat | null = null

  imagenUrl!: SafeUrl;
  objectUrls: string[] = [];


  contratadorService = inject(UsuarioContratadorService)
  loginServ = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  chatService = inject(ChatService)




  obtenerIds(){

    this.idSesion = this.loginServ.getId();


    if(this.chat && this.chat.id && this.idSesion){

      this.chatService.marcarMensajesDeChatComoLeidos(this.chat.id, this.idSesion);


      this.chat.idParticipantes.forEach(id => {
        if(id !== this.idSesion){
          this.idDestinatario = id;
          this.obtenerUsuarioContratador(id)
        }
      })

    }

  }

  obtenerUsuarioContratador(idCont: string){
    this.contratadorService.getUsuariosContratadoresPorId(idCont).pipe(takeUntil(this.destroy$)).subscribe({

      next : (value) => {
        this.usuarioContratador = value;
        this.cargarImagen(value.urlFoto);

      },
      error : (err) => {
        alert("No se ha podido obtener al usuario profesional en el componente list-mensaje.")
        console.log("Error: " + err);

      },

    })
  }

  cargarImagen(fileName: string) {
    this.imageService.getImagen(fileName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        console.error(err);
        alert('Error al cargar la imagen');
      }
    });
  }



  agregarNvoMensaje(nvoMensaje: Mensaje){

    if(this.chat){
      this.chat.mensajes.push(nvoMensaje);
      this.modificarChat(this.chat);
    }
  }


  modificarChat(chatMod: Chat){
    if(chatMod.id){
      this.chatService.putChat(chatMod, chatMod.id).pipe(takeUntil(this.destroy$)).subscribe({
        next : (value) =>{
          alert("Mensaje enviado correctamente.");
        },
      })
    }else{
      alert("No se ha podido mandar el mensaje correctamente.");
    }
  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes['chat'] && changes['chat'].currentValue) {
      console.log('Chat obtenido correctamente del componente padre:', this.chat);
      this.obtenerIds();

    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



}
