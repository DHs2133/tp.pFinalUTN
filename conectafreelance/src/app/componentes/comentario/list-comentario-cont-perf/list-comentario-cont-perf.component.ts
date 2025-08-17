import { Component, inject, Input, OnDestroy, OnInit } from '@angular/core';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { Subject, takeUntil } from 'rxjs';
import { UsuarioContratador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LoginService } from '../../../utils/service/login-service.service';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PromedioService } from '../../../utils/promedio.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';

@Component({
  selector: 'app-list-comentario-cont-perf',
  imports: [RouterLink],
  templateUrl: './list-comentario-cont-perf.component.html',
  styleUrl: './list-comentario-cont-perf.component.css'
})
export class ListComentarioContPerfComponent implements OnInit, OnDestroy {




  usuContratador!: UsuarioContratador;

  comentarios: Comentario[] = [];
  usuariosProf: UsuarioProfesional[] = []
  idContratador: string = " ";
  destroy$ = new Subject<void>();
  imagenUrl!: SafeUrl;
  objectUrls: string[] = [];



  loginService = inject(LoginService);
  comentarioService = inject(ComentarioService);
  contratadorService = inject(UsuarioContratadorService);
  profService = inject(UsuarioProfesionalService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  promedioService = inject(PromedioService);


  ngOnInit(): void {
    this.idContratador = this.loginService.getId();
    this.obtenerUsuarioContratador();

  }

  obtenerUsuarioContratador(){
    this.contratadorService.getUsuariosContratadoresPorId(this.idContratador).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) =>{
        this.usuContratador = value;
        this.inicializarListaComentarios(value.id as string);
        this.cargarImagen(this.usuContratador.urlFoto);


      },
      error : (err) =>{
        alert("Ha ocurrido un error al obtener los comentarios del usuario. Será redirigido a la página principal");
        this.redirecciónHome();
      },

    })

  }

  inicializarListaComentarios(idContratador: string){

    this.comentarioService.getComentarioPorIDcreador(idContratador).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {

        if(value.length > 0){
          this.comentarios = value;
          this.comentarios.forEach(c => this.cargarNombres(c));
        }
      },
      error : (err) => {
        alert("Ha ocurrido un error al obtener los comentarios del usuario. Será redirigido a la página principal");
        this.redirecciónHome();
      },

    })

  }

  cargarNombres(comentario: Comentario){
    this.profService.getUsuariosProfesionalPorID(comentario.idDestinatario).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) =>{

        this.usuariosProf.push(value);
      },
      error(err) {
        console.log("Error: " + err);
      },


    })

  }

  redirecciónHome(){
    this.router.navigate(['/']);
  }



  cargarImagen(fileName: string) {
    this.imageService.getImagen(fileName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        console.error(err);
        alert('Error al cargar la imagen');
      }
    });
  }


  eliminar(idComentario: string | undefined){
    if (!idComentario) {
      console.error('ID de comentario no proporcionado');
      alert('Error. No se ha podido eliminar el comentario');
      return;
    }

    const comentario = this.comentarios.find(c => c.id === idComentario);

    if (!comentario) {
      console.log(`No se encontró el comentario con ID: ${idComentario}`);
      alert('Comentario no encontrado');
      return;
    }

    const confirmacion = confirm('¿Estás seguro de que deseas eliminar tu comentario?');
    if (!confirmacion) {
      console.log('La eliminación del comentario ha sido cancelada.');
      return;
    }


    this.comentarioService.eliminarComentario(idComentario).pipe(takeUntil(this.destroy$)).subscribe({
      next: (response) => {

        alert('Comentario eliminado');
        this.comentarios = this.comentarios.filter(c => c.id !== idComentario);

      },
      error: (err) => {
        console.error('Error al eliminar el comentario:', err);
        alert('No se pudo eliminar el comentario: ' + err.message);
      }
    });


  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
  }


}
