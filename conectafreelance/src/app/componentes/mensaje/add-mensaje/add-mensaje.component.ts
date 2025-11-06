import { Component, EventEmitter, inject, OnDestroy, OnInit, Output } from '@angular/core';
import { Mensaje } from '../interface-mensaje/interface-mensaje';
import { Subject } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { noWhitespaceValidator } from '../../../utils/ValidadoresPersonalizados';
import { LoginService } from '../../../utils/service/login-service.service';

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
  mensajeAEnviar: EventEmitter<Mensaje> = new EventEmitter();

  logService = inject(LoginService);
  fb = inject(FormBuilder);
  activatedRoute = inject(ActivatedRoute);

  formMensaje = this.fb.nonNullable.group({
    idCreador: [""],
    contenido: ["", [Validators.required, Validators.maxLength(500), noWhitespaceValidator()]],
    leido: false,
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

    const mensaje : Mensaje = {
      ...datosMinMensaje,
      leido: false,
    };


    this.emitirMensaje(mensaje);
    this.resetear();

  }

  emitirMensaje(nvoMensaje: Mensaje){


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
