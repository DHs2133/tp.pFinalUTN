import { Component, inject } from '@angular/core';
import { Subject, take, takeUntil } from 'rxjs';
import { LoginService } from '../../../../../utils/service/login-service.service';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioProfesional } from '../../../interfaceUsuario/usuario.interface';
import { ListPublicacionContprofperfComponent } from "../../../../publicacion/list-publicacion-contprofperf/list-publicacion-contprofperf.component";
import { AddComentarioComponent } from "../../../../comentario/add-comentario/add-comentario.component";
import { PromedioService } from '../../../../../utils/promedio.service';
import { FavoritoService } from '../../../../favoritos/serviceFavorito/favorito.service';
import { Favorito } from '../../../../favoritos/interfaceFavoritos/favorito.interface';
import { ComentarioService } from '../../../../comentario/serviceComentario/comentario.service';
import { Comentario } from '../../../../comentario/interfaceComentario/interface-comentario';

@Component({
  selector: 'app-contratador-profesional-perfil',
  imports: [ListPublicacionContprofperfComponent, AddComentarioComponent],
  templateUrl: './contratador-profesional-perfil.component.html',
  styleUrl: './contratador-profesional-perfil.component.css'
})
export class ContratadorProfesionalPerfilComponent {

  idProfesional: string | null = null;
  idContratador: string | null = null;
  imagenUrl!: SafeUrl;
  activeTab: 'publicaciones' | 'comentarios' = 'publicaciones';
  listaFav!: Favorito;
  usuarioProf: UsuarioProfesional = {
    id: " ", nombreCompleto: " ", email: " ", contrasenia: " ", urlFoto: " ",
    activo: true, rol: "profesional", profesion: " ", descripcion: " ",
    ciudad: " ", provincia: " ", pais: " ", promedio: 0, cantComentarios: 0, cantPubRep: 0
  };
  destroy$ = new Subject<void>();

  loginService = inject(LoginService);
  profService = inject(UsuarioProfesionalService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  promedioService = inject(PromedioService);
  listFavService = inject(FavoritoService);
  comentarioService = inject(ComentarioService);

  ngOnInit() {
    this.obtenerIDProfesional();
    this.idContratador = this.loginService.getId();
  }

  obtenerIDProfesional() {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idProfesional = param.get('id');
        if (this.idProfesional) {
          this.traerUsuarioProfesionalDeBDD();
        }
      },
      error: (err) => {
        console.error('Error al obtener parámetros de la ruta:', err);
        this.router.navigate(['contratador/perfil']);
      },
    });
  }

  traerUsuarioProfesionalDeBDD() {
    this.profService.getUsuariosProfesionalPorID(this.idProfesional).pipe(takeUntil(this.destroy$)).subscribe({
      next: (usu: UsuarioProfesional) => {
        if (usu) {
          this.usuarioProf = usu;
          this.calcularPromedioYComentarios(usu.id!);
          this.cargarImagen(this.usuarioProf.urlFoto);
        } else {
          alert('Ha ocurrido un error.');
          this.router.navigate(['contratador/perfil']);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Ha ocurrido un error en el servidor');
      }
    });
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

  setActiveTab(tab: 'publicaciones' | 'comentarios'): void {
    this.activeTab = tab;
  }

  actualizarPromedio(puntajeNvo: number) {
    this.promedioService.agregarPuntaje(puntajeNvo);
    this.usuarioProf.promedio = this.promedioService.getPromedio();
    this.usuarioProf.cantComentarios = this.promedioService.getCantidadElementos();
    this.actualizarCuentaProfesional();
  }

  quitarPuntajeAPromedio(puntajeAEliminar: number | number[]) {
    if (!puntajeAEliminar) return;

    const aEliminar = Array.isArray(puntajeAEliminar) ? puntajeAEliminar : [puntajeAEliminar];
    aEliminar.forEach(p => this.promedioService.eliminarUnElemento(p));

    this.usuarioProf.promedio = this.promedioService.getPromedio();
    this.usuarioProf.cantComentarios = this.promedioService.getCantidadElementos();
    this.actualizarCuentaProfesional();
  }

  actualizarCuentaProfesional() {
    this.profService.putUsuariosProfesionales(this.usuarioProf, this.idProfesional).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {

      },
      error: (err) => {
        console.log('Error al actualizar profesional:', err);
      }
    });
  }

  addUsuarioALista() {
    this.getListaFavUsuarioContratador();
  }

  getListaFavUsuarioContratador() {
    this.listFavService.getFavoritoPorIDCreador(this.idContratador).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        if (value.length > 0) {
          this.listaFav = value[0];
          this.updateListaFavUsuarioContratador();
        }
      },
      error: (err) => {
        alert("No se ha podido actualizar la lista de favoritos.");
        console.log("Error: " + err);
      },
    });
  }

  iniciarChat(prof: UsuarioProfesional) {
    if (prof.id)
      this.router.navigate(['contratador/listaChatsContratador', prof.id]);
  }

  updateListaFavUsuarioContratador() {
    if (this.listaFav.idUsuariosFavoritos.includes(this.idProfesional as string)) {
      alert("El usuario ya está en la lista de favoritos.");
      return;
    }

    this.listaFav.idUsuariosFavoritos.push(this.idProfesional as string);

    if (this.listaFav.id) {
      this.listFavService.putFavorito(this.listaFav, this.listaFav.id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => alert("Lista actualizada con éxito."),
        error: () => alert("No se ha podido agregar al usuario a la lista")
      });
    } else {
      alert("No se ha podido agregar al usuario a la lista. Falta el id");
    }
  }







  calcularPromedioYComentarios(idProfesional: string) {


    this.comentarioService.getComentarioPorIDdestinatario(idProfesional).pipe(takeUntil(this.destroy$)).subscribe({
      next : (resultados) => {
        if(resultados.length > 0){
          const cant = resultados.length;
          const suma = resultados.reduce((acc, c) => acc + c.puntaje, 0);
          const promedio = cant > 0 ? suma / cant : 0;

          this.usuarioProf.cantComentarios = cant;
          this.usuarioProf.promedio = promedio;
        }else{
          this.usuarioProf.cantComentarios = 0;
          this.usuarioProf.promedio = 0;
        }
                  this.actualizarCuentaProfesional();

      },
      error : (err) => {
        console.error("Error: " + err);
        alert("No se ha podido controlar el promedio del usuario profesional");
    }})
  }



















  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.promedioService.deletePuntaje();
  }


}
