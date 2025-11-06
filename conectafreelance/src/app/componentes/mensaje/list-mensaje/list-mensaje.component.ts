import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { Mensaje } from '../interface-mensaje/interface-mensaje';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AddMensajeComponent } from "../add-mensaje/add-mensaje.component";
import { Chat } from '../../chat/interfaceChat/chat.interface';
import { ChatService } from '../../chat/chatService/chat.service';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-list-mensaje',
  imports: [NgClass, AddMensajeComponent, RouterModule],
  templateUrl: './list-mensaje.component.html',
  styleUrl: './list-mensaje.component.css'
})

export class ListMensajeComponent implements OnDestroy, OnChanges{

  usuarioProfesional!:UsuarioProfesional
  idSesion: string = "";
  idDestinatario: string | null = null;
  destroy$ = new Subject<void>();
  @Input()
  chat: Chat | null = null

  imagenUrl!: SafeUrl;
  objectUrls: string[] = [];


  profesionalService = inject(UsuarioProfesionalService)
  loginServ = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  activatedRoute = inject(ActivatedRoute);
  chatService = inject(ChatService)




  obtenerIds(){

    this.idSesion = this.loginServ.getId();


    if(this.chat && this.chat.id && this.idSesion){

      this.chatService.marcarMensajesDeChatComoLeidos(this.chat.id, this.idSesion);


      this.chat.idParticipantes.forEach(id => {
        if(id !== this.idSesion){
          this.idDestinatario = id;
          this.obtenerUsuarioProfesional(id)
        }
      })

    }

  }

  obtenerUsuarioProfesional(idProf: string){
    this.profesionalService.getUsuariosProfesionalPorID(idProf).pipe(takeUntil(this.destroy$)).subscribe({

      next : (value) => {
        this.usuarioProfesional = value;
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
