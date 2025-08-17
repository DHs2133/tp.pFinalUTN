import { LoginService } from './../../../utils/service/login-service.service';
import { Component, inject, OnInit } from '@angular/core';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Subject, takeUntil } from 'rxjs';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { ImageService } from '../../../service/back-end/image.service';
import { CommonModule } from '@angular/common';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { UsuarioContratador } from '../../usuario/interfaceUsuario/usuario.interface';

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

  usuContratadores: UsuarioContratador[] = [];

  loginService = inject(LoginService);
  comentarioService = inject(ComentarioService);
  imagenService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  contratadorService = inject(UsuarioContratadorService);

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
      this.obtenerUsuariosCreadores(comentario);
    });
  }

  obtenerUsuariosCreadores(comentario: Comentario){

    if(comentario.id){
      this.contratadorService.getUsuariosContratadoresPorId(comentario.idCreador).pipe(takeUntil(this.destroy$)).subscribe({
        next: (value) => {

          this.usuContratadores.push(value);
          this.obtenerImagenesPerfilDelServidor(value.urlFoto);

        },
        error(err) {
          alert("Ha ocurrido un error.");
          console.log("err: " + err);
        },

      })
    }
  }

  obtenerImagenesPerfilDelServidor(urlFoto: string) {

    this.imagenService.getImagen(urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.objectUrls.push(objectUrl);
        this.imgPerfCreadores[urlFoto] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);

      },
      error: (err) => {
        console.error(`Error al cargar la imagen de perfil: ${urlFoto}:`, err);
      }
      });

  }


  getUsuarioById(idcreador: string): UsuarioContratador | undefined{
    return this.usuContratadores.find(usuario => usuario.id === idcreador);
  }



  reportarComentario(idComentario: string | undefined) {
    if (!idComentario) {
      console.error('ID de comentario no proporcionado');
      alert('Error. No se ha podido reportar el comentario');
      return;
    }

    const comentario = this.comentarios.find(c => c.id === idComentario);
    if (!comentario) {
      console.log(`No se encontró el comentario con ID: ${idComentario}`);
      alert('Comentario no encontrado');
      return;
    }

    const confirmacion = confirm('¿Estás seguro de que deseas reportar este comentario?');
    if (!confirmacion) {
      console.log('Reporte cancelado por el usuario');
      return;
    }

    const updatedComentario = { ...comentario, reportada: true };
    console.log('Enviando actualización:', updatedComentario);

    this.comentarioService.putComentario(updatedComentario, idComentario).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {
        comentario.reportada = true;
        alert('Comentario reportado');
      },
      error: (err) => {
        console.error('Error al reportar el comentario:', err);
        alert('No se pudo reportar el comentario: ' + err.message);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imgPerfCreadores = {};
  }

}
