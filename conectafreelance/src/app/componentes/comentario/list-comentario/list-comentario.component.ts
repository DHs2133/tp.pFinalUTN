import { LoginService } from './../../../utils/service/login-service.service';
import { Component, inject, OnInit } from '@angular/core';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { ImageService } from '../../../service/back-end/image.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-comentario',
  imports: [CommonModule],
  templateUrl: './list-comentario.component.html',
  styleUrl: './list-comentario.component.css'
})
export class ListComentarioComponent implements OnInit {
  comentarios: Comentario[] = [];
  idDestinatario: string = " ";
  destroy$ = new Subject<void>();
  imgPerfCreadores: { [key: string]: SafeUrl } = {};
  objectUrls: string[] = [];

  loginService = inject(LoginService);
  comentarioService = inject(ComentarioService);
  imagenService = inject(ImageService);
  sanitizer = inject(DomSanitizer);

  ngOnInit(): void {
    this.inicializarListaComentarios();
  }

  inicializarListaComentarios() {
    this.obtenerIDdestinatario();
    this.obtenerComentariosADestinatario();
  }

  obtenerIDdestinatario() {
    this.idDestinatario = this.loginService.getId();
  }

  obtenerComentariosADestinatario() {
    this.comentarioService.getComentarioPorIDdestinatario(this.idDestinatario).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
          this.comentarios = value;
          console.log(this.comentarios);
          this.obtenerImagenes();

        },
        error: (err) => {
          alert("Error. No se pudo obtener los comentarios realizados a este usuario");
          console.error("Error: ", err);
        }
      });
  }

  obtenerImagenes() {
    this.comentarios.forEach((comentario) => {
      this.obtenerImagenesDelServidor(comentario);
    });
  }

  obtenerImagenesDelServidor(comentario: Comentario) {
    if (comentario.fotoCreador) {
      this.imagenService.getImagen(comentario.fotoCreador).pipe(takeUntil(this.destroy$)).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrls.push(objectUrl);
          this.imgPerfCreadores[comentario.fotoCreador] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);

        },
        error: (err) => {
          console.error(`Error al cargar la imagen de la publicación ${comentario.fotoCreador}:`, err);
        }
      });
    }
  }

  reportarComentario(idComentario: string | undefined) {

    if(idComentario){

      const comentario = this.comentarios.find(c => c.id === idComentario);
      if (comentario) {
        const updatedComentario = { ...comentario, reportado: true };
        this.comentarioService.putComentario(updatedComentario, idComentario).pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              alert("Comentario reportado");
              comentario.reportado = true;
            },
            error: (err) => {
              alert("No se pudo reportar el comentario");
              console.error("Error: ", err);
            }
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imgPerfCreadores = {};
  }
}
