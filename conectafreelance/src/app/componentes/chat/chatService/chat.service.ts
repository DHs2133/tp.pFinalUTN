import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Chat } from '../interfaceChat/chat.interface';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  private mensajesNoLeidosSubject = new BehaviorSubject<number>(0);
  mensajesNoLeidos$: Observable<number> = this.mensajesNoLeidosSubject.asObservable();

  constructor(private http: HttpClient) { }

  urlchat: string = 'http://localhost:3001/chats'

  postChat(chatNvo: Chat): Observable<Chat>{

    return this.http.post<Chat>(this.urlchat, chatNvo);
  }




  deleteChatsPorUsario(idUsuario: string): Observable<void> {

    // Llama a fetchChats(idUsuario) para obtener un Observable<Chat[]> con los chats donde el usuario
    // está en idParticipantes. Luego, usa pipe para procesar este Observable.
    return this.fetchChats(idUsuario).pipe(
      // El operador switchMap toma el array de chats emitido por fetchChats y lo transforma en un nuevo
      // Observable. switchMap es útil porque permite devolver otro Observable (como forkJoin o of)

      switchMap(chats => {
        if (chats.length === 0) {
          //  Si no hay chats, devuelve un Observable creado con of(void 0). Aquí:of es una función de
          // RxJS que crea un Observable que emite un valor y se completa. void 0 es una forma de
          // representar undefined en JavaScript/TypeScript, indicando que no se devuelve ningún valor
          // significativo.

          return of(void 0);
        }


        const deleteRequests = chats.map(chat =>
          this.http.delete(`${this.urlchat}/${chat.id}`)
        );

        // Si hay chats, crea un array de solicitudes DELETE usando el método map del array. Para cada
        // chat en chats:Genera una solicitud this.http.delete a http://localhost:3000/chats/{chat.id}
        // para eliminar ese chat específico. Cada solicitud DELETE devuelve un Observable

        return forkJoin(deleteRequests).pipe(map(() => void 0));

        // forkJoin combina todas las solicitudes DELETE en un solo Observable que:Emite un array
        // con los resultados de todas las solicitudes cuando todas se completan. Si alguna solicitud
        // falla, el Observable completo falla. Luego, usa pipe(map(() => void 0)) para transformar el
        // resultado en void (es decir, undefined), asegurando que el tipo de retorno sea
        // Observable<void>.


      })
    );
  }

  getChatsEntreUsuarios(idUsuario: string): Observable<Chat[]> {
    const chat1 = this.http.get<Chat[]>(`${this.urlchat}?idUsuarioA=${idUsuario}`);
    const chat2 = this.http.get<Chat[]>(`${this.urlchat}?idUsuarioB=${idUsuario}`);

    return forkJoin([chat1, chat2]).pipe(
      map(([chatAB, chatBA]) => {

      const combinedChats = [...chatAB, ...chatBA];
      const uniqueChats = combinedChats.filter(
        (chat, index, self) =>
          index === self.findIndex(c => c.id === chat.id)
      );
      return uniqueChats;
      })
    );
  }

  // Obtener todos los chats donde el usuario es un participante
  fetchChats(idUsuario: string): Observable<Chat[]> {
    return this.http.get<Chat[]>(this.urlchat).pipe(
      map(chats => chats.filter(c => c.idParticipantes.includes(idUsuario)))
    );
  }

  // Calcular y emitir el número de mensajes no leídos
  fetchMensajesNoLeidos(idUsuario: string): void {
    this.fetchChats(idUsuario).subscribe({
      next: (chats: Chat[]) => {
        const totalNoLeidos = chats.reduce((total, chat) => {
          return total + chat.mensajes.filter(
            mensaje => !mensaje.leido && mensaje.idCreador !== idUsuario
          ).length;
        }, 0);
        this.mensajesNoLeidosSubject.next(totalNoLeidos);
        console.log('Total no leídos:', totalNoLeidos);
      },
      error: err => console.error('Error al obtener chats:', err)
    });
  }

  // Marcar los mensajes de un chat como leídos
  marcarMensajesDeChatComoLeidos(idChat: string, idUsuario: string): void {
    this.fetchChats(idUsuario).subscribe({
      next: (chats: Chat[]) => {
        const chat = chats.find(c => c.id === idChat);
        if (chat) {
          // Crear una copia del chat con los mensajes no leídos marcados como leídos
          const updatedChat = {
            ...chat,
            mensajes: chat.mensajes.map(mensaje => ({
              ...mensaje,
              leido: mensaje.idCreador !== idUsuario ? true : mensaje.leido
            }))
          };

          // Actualizar el chat completo en la API
          this.putChat(updatedChat, idChat).subscribe({
            next: () => {
              this.fetchMensajesNoLeidos(idUsuario);
            },
            error: err => console.error('Error al actualizar chat:', err)
          });
        }
      },
      error: err => console.error('Error al obtener chat:', err)
    });
  }

  putChat(chatMod: Chat, id: string | null): Observable<Chat>{

    return this.http.put<Chat>(`${this.urlchat}/${id}`, chatMod);
  }

}
