import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { UsuarioContratador } from '../../usuario/interfaceUsuario/usuario.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { LoginService } from '../../../utils/service/login-service.service';
import { ImageService } from '../../../service/back-end/image.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-comentario-reportado',
  imports: [],
  templateUrl: './list-comentario-reportado.component.html',
  styleUrl: './list-comentario-reportado.component.css'
})
export class ListComentarioReportadoComponent implements OnInit, OnDestroy{

  destroy$ = new Subject<void>();
  comentarioUsuario: Comentario[] = [];
  imagenesPerfil: { [key: string]: SafeUrl } = {};
  usuariosCont: UsuarioContratador[] = [];

  objectUrls: string[] = [];
  objectUrlsPerfil: string[] = [];

  comentarioService = inject(ComentarioService);
  contratadorService = inject(UsuarioContratadorService);
  loginServ = inject(LoginService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);

  ngOnInit(): void {
    this.getListaDePublicaciones();
  }

  getUsuarioContratadorById(id: string): UsuarioContratador | undefined {
    return this.usuariosCont.find(uCont => uCont.id === id);
  }

  getListaDePublicaciones() {
    this.comentarioService.getComentariosReportados().pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        this.comentarioUsuario = value || [];
        console.log('Comentarios obtenidos:', this.comentarioUsuario);
        this.comentarioUsuario.forEach(com => this.getUsuarioContratador(com.idCreador));
      },
      error: (err) => {
        console.error('Error al obtener publicaciones:', err);
      }
    });
  }

  getUsuarioContratador(idCont: string) {
    this.contratadorService.getUsuariosContratadoresPorId(idCont).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        if (!this.usuariosCont.some(uCont => uCont.id === value.id)) {
          this.usuariosCont.push(value);
          this.obtenerImagenPerfilDelServidor(value);
        }
      },
      error: (err) => {
        console.error('Error al obtener usuario profesional:', err);
      }
    });
  }

  obtenerImagenPerfilDelServidor(usuCont: UsuarioContratador) {
    if (usuCont.urlFoto) {
      const urlFoto = usuCont.urlFoto;
      this.imageService.getImagen(urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrlsPerfil.push(objectUrl);
          this.imagenesPerfil[usuCont.id!] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: (err) => {
          console.error(`Error al cargar la imagen del perfil ${urlFoto}:`, err);
        }
      });
    }
  }

  controlar(comReportado: Comentario, decision: "aprobar" | "eliminar") {
    if (decision === "aprobar") {

      const confirmacion = confirm('¿Estás seguro de que deseas aprobar el comentario?');
      if (!confirmacion) {
        console.log('La publicación ha sido aprobada.');
        return;
      }

      this.aprobado(comReportado);
    } else {

      const confirmacion = confirm('¿Estás seguro de que deseas eliminar el comentario?');
      if (!confirmacion) {
        console.log('La publicación ha sido aprobada.');
        return;
      }
      this.eliminar(comReportado);
    }
    this.comentarioUsuario = this.comentarioUsuario.filter(com => com.id !== comReportado.id);

  }

  aprobado(comReportado: Comentario){
    comReportado.controlado = true;
    comReportado.reportada = false;
    if (comReportado.id) {
      this.comentarioService.putComentario(comReportado, comReportado.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: (value) => {
          alert("Comentario aprobado.");
        },
        error: (err) => {
          alert("No se ha podido aprobar el comentario.");
          console.log("Error: " + err);
        }
      });
    }
  }

  eliminar(comentario: Comentario) {
    if (comentario.id) {
      this.eliminarComentario(comentario.id);
    }
  }

  eliminarComentario(idComentario: string) {
    this.comentarioService.eliminarComentario(idComentario).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        alert('Comentario eliminado.');
      },
      error: (err) => {
        alert('No se pudo eliminar la publicación.');
        console.error(err);
      }
    });
  }

  irAPerfilProfesional(idProfesional: string) {
    this.router.navigate(['/perfil-profesional', idProfesional]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrlsPerfil.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imagenesPerfil = {};
  }

}
