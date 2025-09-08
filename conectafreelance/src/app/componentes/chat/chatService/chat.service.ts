import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { forkJoin, map, Observable } from 'rxjs';
import { Chat } from '../interfaceChat/chat.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private http: HttpClient) { }

  urlchat: string = 'http://localhost:3001/chats'

  postChat(chatNvo: Chat): Observable<Chat>{

    return this.http.post<Chat>(this.urlchat, chatNvo);
  }


  getChatEntreUsuarios(idUsuarioA: string | null, idUsuarioB: string | null): Observable<Chat | null> {

    const chat1 = this.http.get<Chat>(`${this.urlchat}?idUsuarioA=${idUsuarioA}&idUsuarioB=${idUsuarioB}`);
    const chat2 = this.http.get<Chat>(`${this.urlchat}?idUsuarioA=${idUsuarioB}&idUsuarioB=${idUsuarioA}`);

    return forkJoin([chat1, chat2]).pipe(
      map(([chatAB, chatBA]) => {

        if(chatAB){

          return chatAB

        }else if(chatBA){

          return chatBA

        }else{
          return null
        }

      })
    )
  }

  getChatsEntreUsuarios(idUsuario: string ): Observable<Chat[]> {

    const chat1 = this.http.get<Chat[]>(`${this.urlchat}?idUsuarioA=${idUsuario}`);
    const chat2 = this.http.get<Chat[]>(`${this.urlchat}?idUsuarioB=${idUsuario}`);

    return forkJoin([chat1, chat2]).pipe(
      map(([chatAB, chatBA]) => {

        if(chatAB){

          return chatAB

        }else if(chatBA){

          return chatBA

        }else{
          return null
        }

      })
    )
  }

  putChat(chatMod: Chat, id: string | null): Observable<Chat>{

    return this.http.put<Chat>(`${this.urlchat}/${id}`, chatMod);
  }



}
