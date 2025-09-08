import { Component, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { Mensaje } from '../interface-mensaje/interface-mensaje';
import { Subject, takeUntil } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { noWhitespaceValidator } from '../../../utils/ValidadoresPersonalizados';
import { LoginService } from '../../../utils/service/login-service.service';
import { ChatService } from '../../chat/chatService/chat.service';

@Component({
  selector: 'app-add-mensaje',
  imports: [ReactiveFormsModule],
  templateUrl: './add-mensaje.component.html',
  styleUrl: './add-mensaje.component.css'
})
export class AddMensajeComponent implements OnInit, OnDestroy{

  idCreador: string | null = null;
  idDestinatario: string | null = null;
  destroy$ = new Subject<void>();

  @Output()
  mensajeAEnviar: EventEmitter<Mensaje> = new EventEmitter;;

  logService = inject(LoginService);
  chatService = inject(ChatService);
  fb = inject(FormBuilder);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);


  formMensaje = this.fb.nonNullable.group({
    id: [""],
    idCreador: [""],
    contenido: ["", [Validators.required, Validators.maxLength(500), noWhitespaceValidator()]],
    leido: false,
    visualizado: false
  });

  ngOnInit(): void {
    this.idCreador = this.logService.getId();

    this.formMensaje.patchValue({

      idCreador : this.idCreador
    })
  }


  mandarMensaje() {
    if (this.formMensaje.invalid) {
      alert("Formulario inválido");
      return;
    }
    const datosMinMensaje = this.formMensaje.getRawValue();

    const mensaje = {
      ...datosMinMensaje,
      leido: false,
      visualizado: false
    };


    this.emitirMensaje(mensaje);

  }

  emitirMensaje(nvoMensaje: Mensaje){

    this.resetear();

    this.mensajeAEnviar.emit(nvoMensaje);

  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }


  resetear() {
    this.formMensaje.get('contenido')?.setValue('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }




}
