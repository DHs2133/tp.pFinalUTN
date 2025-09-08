import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { Mensaje } from '../interface-mensaje/interface-mensaje';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AddMensajeComponent } from "../add-mensaje/add-mensaje.component";
import { Chat } from '../../chat/interfaceChat/chat.interface';

@Component({
  selector: 'app-list-mensaje',
  imports: [AddMensajeComponent],
  templateUrl: './list-mensaje.component.html',
  styleUrl: './list-mensaje.component.css'
})
export class ListMensajeComponent implements OnInit, OnDestroy{

  usuarioProfesional!:UsuarioProfesional
  mensajes: Mensaje[] = [];
  chatUsuario!: Chat;
  imagenPerfil!: SafeUrl;
  idEmisor: string = "";
  idDestinatario: string | null = null;
  destroy$ = new Subject<void>();


  profesionalService = inject(UsuarioProfesionalService)
  loginServ = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);


  ngOnInit(): void {
    this.obtenerIdCreador();
    this.obtenerIdDestinatario();
  }

  obtenerIdCreador(){
    this.idEmisor = this.loginServ.getId();
  }

  obtenerIdDestinatario(){

    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idDestinatario = param.get('idDestinatario');
          if (!this.idDestinatario) {
            alert("Ha ocurrido un error. Será redirigido a su perfil.")
            this.router.navigate(['/perfilContratador']);
          }
        },
        error: (err) => {
          console.error('Error al obtener parámetros de la ruta:', err);
          this.router.navigate(['/perfilContratador']);
        },
    });
  }


  agregarNvoMensaje(nvoMensaje: Mensaje){

    this.mensajes.push(nvoMensaje);
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }



}
