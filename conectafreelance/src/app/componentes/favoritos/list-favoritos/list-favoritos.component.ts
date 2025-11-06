import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { LoginService } from '../../../utils/service/login-service.service';
import { Favorito } from '../interfaceFavoritos/favorito.interface';
import { catchError, forkJoin, of, Subject, takeUntil } from 'rxjs';
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
export class ListFavoritosComponent implements OnInit, OnDestroy{

  idDuenio: string | null = null;
  destroy$ = new Subject<void>();
  listaFav: Favorito = {
    id: '',
    idDuenio: '',
    idUsuariosFavoritos: []
  };
  idUsuProfLista: string[] = [];
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
    if (this.idDuenio) {
      this.obtenerListaDeFavoritos(this.idDuenio);
    }
  }

  obtenerListaDeFavoritos(idDuenio: string): void {

    this.listFavService.getFavoritoPorIDCreador(idDuenio).pipe(takeUntil(this.destroy$)).subscribe({
      next: (value) => {
        if (value.length > 0) {
          this.listaFav = value[0];
          this.idUsuProfLista = this.listaFav.idUsuariosFavoritos;
          if (this.idUsuProfLista.length > 0) {
            this.obtenerUsuariosProfesionales(this.idUsuProfLista);
          }
        }
      },
      error: (err) => {
        console.error('Error al obtener la lista de favoritos:', err);
      }
    });
  }

  obtenerUsuariosProfesionales(ids: string[]): void {
    const requests = ids.map(id =>
      this.usuProfService.getUsuariosProfesionalPorID(id).pipe(
        catchError(() => of(null))
      )
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results: (UsuarioProfesional | null)[]) => {
        const validUsers = results.filter((user): user is UsuarioProfesional => user !== null);
        const invalidIds = ids.filter((_, index) => results[index] === null);

        this.usuProfLista = validUsers;

        if (invalidIds.length > 0) {
          this.idUsuProfLista = this.idUsuProfLista.filter(id => !invalidIds.includes(id));
          this.listaFav.idUsuariosFavoritos = this.idUsuProfLista;
          this.updateListaFav(this.listaFav, this.listaFav.id);
        }

        if (validUsers.length > 0) {
          this.obtenerImagenesPerfilDelServidor(validUsers.map(user => user.urlFoto));
        }
      },
      error: (err) => {
        console.error('Error al obtener usuarios profesionales:', err);
      }
    });
  }

  obtenerImagenesPerfilDelServidor(urlsFotos: string[]): void {

    const uniqueUrls = [...new Set(urlsFotos.filter(url => url && url.trim() !== ''))];

    if (uniqueUrls.length === 0) {
      return;
    }

    const requests = uniqueUrls.map(url =>
      this.imagenService.getImagen(url).pipe(
        catchError(() => of(null)) // Retorna null si falla la solicitud para una imagen
      )
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (results: (Blob | null)[]) => {
        results.forEach((blob, index) => {
          if (blob) {
            const objectUrl = URL.createObjectURL(blob);
            this.objectUrls.push(objectUrl);
            this.imgPerfCreadores[uniqueUrls[index]] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
          } else {
            console.warn(`No se pudo cargar la imagen para la URL: ${uniqueUrls[index]}`);
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar imágenes de perfil:', err);
      }
    });
  }

  redirigir(idProf: string | undefined): void {
    if (idProf) {
      this.router.navigate(['contratador/contprofperfil', idProf]);
    } else {
      this.router.navigate(['pagina-no-encontrada']);
    }
  }

  eliminarFavorito(idProf: string | undefined): void {
    if (idProf) {
      this.idUsuProfLista = this.idUsuProfLista.filter(id => id !== idProf);
      this.usuProfLista = this.usuProfLista.filter(u => u.id !== idProf);
      this.listaFav.idUsuariosFavoritos = this.idUsuProfLista;
      this.updateListaFav(this.listaFav, this.listaFav.id);
    }
  }

  updateListaFav(listaFav: Favorito, id: string | undefined): void {
    if (id) {
      this.listFavService.putFavorito(listaFav, id).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          alert('Lista actualizada.');
        },
        error: (err) => {
          alert('No se ha podido actualizar la lista');
          console.error('Error:', err);
        }
      });
    } else {
      alert('No se pudo obtener el id de la lista.');
    }
  }

  estaActivada(usuProf: UsuarioProfesional): boolean{

    if(usuProf.activo){
      return true;
    }

    return false;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imgPerfCreadores = {};
  }


}
