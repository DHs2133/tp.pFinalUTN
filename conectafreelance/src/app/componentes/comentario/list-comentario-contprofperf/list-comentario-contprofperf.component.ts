import { Component, inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { Subject, takeUntil } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { LoginService } from '../../../utils/service/login-service.service';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PromedioService } from '../../../utils/promedio.service';
import { UsuarioContratador } from '../../usuario/interfaceUsuario/usuario.interface';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';

@Component({
  selector: 'app-list-comentario-contprofperf',
  imports: [RouterModule],
  templateUrl: './list-comentario-contprofperf.component.html',
  styleUrl: './list-comentario-contprofperf.component.css'
})
export class ListComentarioContprofperfComponent implements OnInit, OnDestroy, OnChanges {


  @Output()
  puntajeAEliminar: EventEmitter<number> = new EventEmitter;

  @Input()
  comentarioNvo!: Comentario;
  comentarios: Comentario[] = [];
  idDestinatario: string | null = null;
  idContratador: string = " ";
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
    this.idContratador = this.loginService.getId();
  }

  inicializarListaComentarios() {
    this.obtenerIDdestinatario();
    this.obtenerComentariosADestinatario();
  }

  obtenerIDdestinatario() {
   this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idDestinatario = param.get('id');
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

        this.puntajeAEliminar.emit(comentario.puntaje);
      },
      error: (err) => {
        console.error('Error al eliminar el comentario:', err);
        alert('No se pudo eliminar el comentario: ' + err.message);
      }
    });


  }


  ngOnChanges(changes: SimpleChanges) {
    if (changes['comentarioNvo'] && changes['comentarioNvo'].currentValue) {
      this.comentarios.push(changes['comentarioNvo'].currentValue);
      console.log('Nuevo comentario agregado:', this.comentarios);
      this.obtenerUsuariosCreadores(changes['comentarioNvo'].currentValue);
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
