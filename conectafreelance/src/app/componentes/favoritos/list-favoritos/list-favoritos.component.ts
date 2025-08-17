import { Component, inject, OnInit } from '@angular/core';
import { LoginService } from '../../../utils/service/login-service.service';
import { Favorito } from '../interfaceFavoritos/favorito.interface';
import { Subject, takeUntil } from 'rxjs';
import { FavoritoService } from '../serviceFavorito/favorito.service';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ImageService } from '../../../service/back-end/image.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-list-favoritos',
  imports: [],
  templateUrl: './list-favoritos.component.html',
  styleUrl: './list-favoritos.component.css'
})
export class ListFavoritosComponent implements OnInit{


  idDuenio: string | null = null;
  destroy$ = new Subject<void>();

  listaFav: Favorito = {

    id: " ",
    idDuenio: " ",
    idUsuariosFavoritos: []

  }

  idUsuProfLista: string[]=[];
  usuProfLista: UsuarioProfesional[] = [];
  imgPerfCreadores: { [key: string]: SafeUrl } = {};
  objectUrls: string[] = [];


  loginService = inject(LoginService);
  listFavService = inject(FavoritoService);
  usuProfService = inject(UsuarioProfesionalService);
  imagenService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);



  ngOnInit(): void {
    this.idDuenio = this.loginService.getId();
    this.obtenerListaDeFavoritos(this.idDuenio);
  }


  obtenerListaDeFavoritos(idDuenio: string){

    this.listFavService.getFavoritoPorIDCreador(idDuenio).pipe(takeUntil(this.destroy$)).subscribe({

      next : (value) => {
        if(value.length > 0){
          this.listaFav = value[0];
          this.idUsuProfLista = this.listaFav.idUsuariosFavoritos;
          this.idUsuProfLista.forEach(id => this.obtenerUsuariosProfesionales(id));
        }

      },

    })

  }

  obtenerUsuariosProfesionales(id: string){
    this.usuProfService.getUsuariosProfesionalPorID(id).pipe(takeUntil(this.destroy$)).subscribe({
      next : (value) => {
        this.usuProfLista.push(value);
        this.usuProfLista.forEach(up => this.obtenerImagenesPerfilDelServidor(up.urlFoto));
      },

    })

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

  redirigir(idProf: string | undefined){
    if(idProf){
      this.router.navigate(['/contprofperfil', idProf]);
    }else{
      /// acá voy a tener que poner algo como página no encontrada
    }

  }

  eliminarFavorito(idProf: string | undefined){

    if(idProf){
      this.idUsuProfLista = this.idUsuProfLista.filter(id => id !== idProf);
      this.usuProfLista = this.usuProfLista.filter(u => u.id !== idProf);
      this.listaFav.idUsuariosFavoritos = this.listaFav.idUsuariosFavoritos.filter(e => e !== idProf);
      this.updateListaFav(this.listaFav, this.listaFav.id);

    }

  }

  updateListaFav(listaFav: Favorito, id: string | undefined){

    if(id){
      this.listFavService.putFavorito(listaFav, id).pipe(takeUntil(this.destroy$)).subscribe({
        next(value) {
          alert("Lista actualizada.");
        },
        error(err) {
          alert("No se ha podido actualizar la lista");
          console.log("Error: " + err);
        },

      })
    }else{
      alert("No se pudo obtener el id de la lista.");
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
