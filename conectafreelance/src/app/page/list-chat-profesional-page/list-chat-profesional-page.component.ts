import { Component, inject } from '@angular/core';
import { LoginService } from '../../utils/service/login-service.service';
import { ChatService } from '../../componentes/chat/chatService/chat.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Chat } from '../../componentes/chat/interfaceChat/chat.interface';
import { Subject, takeUntil } from 'rxjs';
import { ListChatsParaProfesionalComponent } from "../../componentes/chat/list-chats-para-profesional/list-chats-para-profesional.component";

@Component({
  selector: 'app-list-chat-profesional-page',
  imports: [ListChatsParaProfesionalComponent],
  templateUrl: './list-chat-profesional-page.component.html',
  styleUrl: './list-chat-profesional-page.component.css'
})
export class ListChatProfesionalPageComponent {


  loginService = inject(LoginService);
  chatService = inject(ChatService);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);



  chats: Chat[]= [];
  flagIdProf: boolean = false;
  loading: boolean = true;

  // Si chats.length = 0 y idUsuProf es "null" y flagIdProf = false; no se debe crear nada
  // Si chats.length > 0 y idUsuProf es "null" y flagIdProf = false; no se debe crear nada. Existen chats pero el idProf al ser null indica que entró utilizando el navbar
  // Si chats.length > 0 y idUsuProf posee valor y flagIdProf = true; no se debe crear nada. Existen chats, hay idProf, y como flag es true, significa que ya tiene un chat con ese usuario


  // Si chats.length = 0 y idUsuProf posee valor y flagIdProf = false; Se debe crear un chat
  // Si chats.length > 0 y idUsuProf posee valor y flagIdProf = false; Se debe crear un chat. Existen chats, hay idProf, pero como flag es false, significa que no tiene un chat con ese usuario


  // Si chats.length > 0 y idUsuProf es "null" y flagIdProf = true; Situación imposible. Sin id profesional no hay forma de que "flag" se haga true.
  // Si chats.length = 0 y idUsuProf posee valor y flagIdProf = true; Situación imposible. flagIdProf no puede ser true si no hay chat para buscar


  idSesion: string | null = null;
  idUsuCont: string | null = null;
  destroy$ = new Subject<void>();



  ngOnInit(): void {
    // se llama la función para buscar el id
    this.obtenerIdSesion();
  }

  obtenerIdSesion(){

    // se obtiene el id de sesión
    this.idSesion = this.loginService.getId();
    // se procede a buscar el id del profesional.
    this.obtenerChat(this.idSesion);

  }

  obtenerChat(idSesion: string){

    this.chatService.getChatsEntreUsuarios(idSesion).pipe(takeUntil(this.destroy$)).subscribe({

      next: (chats) => {
        // si el usuario ya tiene chats

        if(chats.length > 0){
          // se busca si existe un chat en el que el participante sea el usuario profesional
          this.chats = chats;
        }

        // La carga debe finalizar independientemente de si el usuario tiene o no mensajes o chats.
        // Si el array de chats está vacío, significa que no hay chats con el profesional.
        // Si hay chats pero la bandera no cambió a true tras recorrerlos, entonces se debe crear un nuevo chat.
        this.loading = false;


        console.log("Chats: " + this.chats);
        console.log("idProf: " + this.idUsuCont);
        console.log("flag: " + this.flagIdProf);




      },
      error: (err) => {
        alert('Error al obtener los chats: ' + err);
        this.router.navigate(['/contratador/perfilContratador']);

      }
    });


  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }


}
