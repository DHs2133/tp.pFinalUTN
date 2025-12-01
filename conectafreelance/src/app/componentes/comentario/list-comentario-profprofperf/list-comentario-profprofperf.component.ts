import { Component, inject } from '@angular/core';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioContratador } from '../../usuario/interfaceUsuario/usuario.interface';
import { LoginService } from '../../../utils/service/login-service.service';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PromedioService } from '../../../utils/promedio.service';

@Component({
  selector: 'app-list-comentario-profprofperf',
  imports: [],
  templateUrl: './list-comentario-profprofperf.component.html',
  styleUrl: './list-comentario-profprofperf.component.css'
})
export class ListComentarioProfprofperfComponent {
  // lista de comentarios utilizada para el usuario profesional que visualiza un perfil profesional.

 //Lo que tengo que hacer es utilizar este componente para hacer el de comentarios eliminados. Y debo utilizar
 //lo que hice en el componente de publicaciones eliminadas para mostrar como va a ser la visualizacion
 //del motivo


  comentarios: Comentario[] = [];
  idDestinatario: string | null = null;
  destroy$ = new Subject<void>();
  imgPerfCreadores: { [key: string]: SafeUrl } = {};
  objectUrls: string[] = [];
  usuContratadores: UsuarioContratador[] = [];




  loginService = inject(LoginService);
  comentarioService = inject(ComentarioService);
  contratadorService = inject(UsuarioContratadorService);
  imagenService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  activatedRoute = inject(ActivatedRoute);
  router = inject(Router);
  promedioService = inject(PromedioService);



  ngOnInit(): void {
    this.inicializarListaComentarios();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imgPerfCreadores = {};
  }


  inicializarListaComentarios() {
    this.obtenerIDdestinatario();

  }


  esUsuarioOComentarioActivo(comentario: Comentario){
    const usuCont = this.usuContratadores.find(u => u.id === comentario.idCreador);

    if(usuCont && usuCont.activo){
      return true;
    }

    return false;
  }


  obtenerIDdestinatario() {
   this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idDestinatario = param.get('id');
        if (!this.idDestinatario) {
          alert("Ha ocurrido un error. Será redirigido a su perfil.")
          this.router.navigate(['profesional/perfil']);
        }
        this.obtenerComentariosADestinatario();
      },
      error: (err) => {
        console.error('Error al obtener parámetros de la ruta:', err);
        this.router.navigate(['/perfilContratador']);
      },
    });
  }

  obtenerComentariosADestinatario() {
    this.comentarioService.getComentarioPorIDdestinatario(this.idDestinatario).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
          if(value.length > 0){
            this.comentarios = value;
            this.cargarPuntajesParaPromedio();
            console.log(this.comentarios);
            this.obtenerImagenes();
          }

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




  cargarPuntajesParaPromedio(){

    this.comentarios.forEach(c => this.promedioService.agregarPuntaje(c.puntaje));
  }


}
