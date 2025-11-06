import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { LoginService } from '../../utils/service/login-service.service';
import { ChatService } from '../../componentes/chat/chatService/chat.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Chat } from '../../componentes/chat/interfaceChat/chat.interface';
import { Subject, takeUntil } from 'rxjs';
import { ListaChatsComponent } from '../../componentes/chat/lista-chats/lista-chats.component';
import { ListChatsNvochatComponent } from '../../componentes/chat/list-chats-nvochat/list-chats-nvochat.component';

@Component({
  selector: 'app-list-chat-page',
  imports: [ListaChatsComponent,
    ListChatsNvochatComponent
  ],
  templateUrl: './list-chat-page-para-contratador.component.html',
  styleUrl: './list-chat-page-para-contratador.component.css'
})
export class ListChatPageParaContratadorComponent implements OnInit, OnDestroy{

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
  idUsuProf: string | null = null;
  destroy$ = new Subject<void>();



  ngOnInit(): void {
    // se llama la función para buscar el id
    this.obtenerIdSesion();
  }


  obtenerIdSesion(){
    // se obtiene el id de sesión
    this.idSesion = this.loginService.getId();
    console.log("CONSOLE LOOOOOOOOOOOOOOOOOOOOOOOOOOOOG 1:  ID SESION: "+ this.idSesion);
    // se procede a buscar el id del profesional.
    this.obtenerIdProfesional()
  }


  obtenerIdProfesional(){
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (params) => {

        // se obtiene el id del usuario profesional en caso de que exista en el parámetro de la ruta
        this.idUsuProf = params.get('idProf');

        if (this.idUsuProf) {
              console.log("CONSOLE LOOOOOOOOOOOOOOOOOOOOOOOOOOOOG 2.1:  ID PROF: "+ this.idUsuProf);

          // si existe, hay que fijarse si el usuario tiene ya un chat con este usuario
          this.obtenerChat(this.idSesion as string);

        }else{
          // si la ruta no tiene el parámetro entonces idUsuProf es null, por lo que el usuario
          // accedió desde su navbar solo para ver sus mensajes.
          console.log("CONSOLE LOOOOOOOOOOOOOOOOOOOOOOOOOOOOG 2.2:  NO HAY ID PROF: "+ this.idUsuProf);

          this.loading = false;
          // loading cambiar a false. Como el array de chats va a ser de longitud 0 y el idProfesional
          // es null, entonces se redirige a app-lista-chats

        }
        //Si es null, no se busca ningún chat y "chat" queda null

      },
      error: (err) => {
          alert('Error al obtener parámetros de la ruta:' + err);
        }
      });
  }

  obtenerChat(idSesion: string){

    this.chatService.fetchChats(idSesion).pipe(takeUntil(this.destroy$)).subscribe({
      next: (chats) => {
        // si el usuario ya tiene chats
        if(chats.length > 0){
          // se busca si existe un chat en el que el participante sea el usuario profesional
          this.chats = chats;
          this.chats.forEach(c =>
            c.idParticipantes.forEach(id =>{
              if(id === this.idUsuProf){
                // si existe un chat que tenga de participante al usuario prof, entonces el usuario
                // ya tiene un chat con el usuario. Se levanta la bandera
                this.flagIdProf = true;
              }
            }
            )
          )
        }
        // La carga debe finalizar independientemente de si el usuario tiene o no mensajes o chats.
        // Si el array de chats está vacío, significa que no hay chats con el profesional.
        // Si hay chats pero la bandera no cambió a true tras recorrerlos, entonces se debe crear un nuevo chat.
        this.loading = false;


        console.log("Chats: " + this.chats);
        console.log("idProf: " + this.idUsuProf);
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
