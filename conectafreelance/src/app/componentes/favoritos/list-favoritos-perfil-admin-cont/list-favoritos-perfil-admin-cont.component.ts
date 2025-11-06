import { Component, inject } from '@angular/core';
import { catchError, forkJoin, of, Subject, takeUntil } from 'rxjs';
import { Favorito } from '../interfaceFavoritos/favorito.interface';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { FavoritoService } from '../serviceFavorito/favorito.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { ImageService } from '../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-list-favoritos-perfil-admin-cont',
  imports: [],
  templateUrl: './list-favoritos-perfil-admin-cont.component.html',
  styleUrl: './list-favoritos-perfil-admin-cont.component.css'
})
export class ListFavoritosPerfilAdminContComponent {

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

  listFavService = inject(FavoritoService);
  usuProfService = inject(UsuarioProfesionalService);
  imagenService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);


  ngOnInit(): void {
    this.obtenerIdCreador();

  }

  esProfesionalInactivo(profesional: UsuarioProfesional): boolean {
    return profesional.activo === false;
  }

  obtenerIdCreador(){

    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idDuenio = param.get('id');
        if (this.idDuenio) {
          this.obtenerListaDeFavoritos(this.idDuenio);
        }
      },
      error: (err) => {
        console.error('Error al obtener parámetros de la ruta:', err);
        this.router.navigate(['profesional/perfil']);
      },
    });
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
        catchError(() => of(null))
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
      this.router.navigate(['admin/admprofperfil', idProf]);
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imgPerfCreadores = {};
  }


}
