import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesional } from '../../../interfaceUsuario/usuario.interface';
import { Subject, takeUntil } from 'rxjs';
import { LoginService } from '../../../../../utils/service/login-service.service';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { ActivatedRoute, Router } from '@angular/router';
import { PromedioService } from '../../../../../utils/promedio.service';
import { ListPublicacionesAdmprofperfComponent } from '../../../../publicacion/list-publicaciones-admprofperf/list-publicaciones-admprofperf.component';
import { ListComentarioAdmprofperfComponent } from '../../../../comentario/list-comentario-admprofperf/list-comentario-admprofperf.component';

@Component({
  selector: 'app-admin-profesional-perfil',
  imports: [ListPublicacionesAdmprofperfComponent, ListComentarioAdmprofperfComponent],
  templateUrl: './admin-profesional-perfil.component.html',
  styleUrl: './admin-profesional-perfil.component.css'
})
export class AdminProfesionalPerfilComponent {

  idProfesional: string | null = null;
  idContratador: string | null = null;
  imagenUrl!: SafeUrl;
  activeTab: 'publicaciones' | 'comentarios' = 'publicaciones';
  usuarioProf: UsuarioProfesional = {

    id: " ",
    nombreCompleto: " ",
    email: " ",
    contrasenia: " ",
    urlFoto: " ",
    activo: true,
    rol: "profesional",
    profesion: " ",
    descripcion: " ",
    ciudad: " ",
    provincia: " ",
    pais: " ",
    promedio: 0,
    cantComentarios: 0,
    cantPubRep: 0

  }
  destroy$ = new Subject<void>();



  loginService = inject(LoginService);
  profService = inject(UsuarioProfesionalService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  promedioService = inject(PromedioService);


  ngOnInit() {
    this.obtenerIDProfesional();
    this.idContratador = this.loginService.getId();
  }

  obtenerIDProfesional(){
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idProfesional = param.get('id');
        if (this.idProfesional) {
          this.traerUsuarioProfesionalDeBDD();
        }
      },
      error: (err) => {
        console.error('Error al obtener parámetros de la ruta:', err);
        this.router.navigate(['admin/perfil']);
      },
    });
  }

  traerUsuarioProfesionalDeBDD() {
    this.profService.getUsuariosProfesionalPorID(this.idProfesional).pipe(takeUntil(this.destroy$)).subscribe({
      next: (usu: UsuarioProfesional) => {
        if (usu) {
          this.usuarioProf = usu;

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


  actualizarPromedio(puntajesNvo: number[]){

    puntajesNvo.forEach(n => this.promedioService.agregarPuntaje(n));

    this.usuarioProf.promedio = this.promedioService.getPromedio();
    this.usuarioProf.cantComentarios = this.promedioService.getCantidadElementos();

    this.actualizarCuentaProfesional(this.usuarioProf);

  }

  quitarPuntajeAPromedio(puntajeAEliminar: number){
    this.promedioService.eliminarUnElemento(puntajeAEliminar);
    this.usuarioProf.promedio = this.promedioService.getPromedio();
    this.usuarioProf.cantComentarios = this.promedioService.getCantidadElementos();
    this.actualizarCuentaProfesional(this.usuarioProf);

  }

  actualizarCuentaProfesional(usuProf: UsuarioProfesional){
    this.profService.putUsuariosProfesionales(this.usuarioProf, this.idProfesional).pipe(takeUntil(this.destroy$)).subscribe({
      next: (usu: UsuarioProfesional) => {
        console.log('Se ha actualizado la información.');


      },
      error: (err) => {
        alert('No se ha podido actualizar la información.');
        console.log('Error: ' + err);
      }
    });
  }


  activarCuentaProfesional(){
    const confirmado = window.confirm('¿Estás seguro de que querés activar esta cuenta?');
    if (confirmado) {
      this.usuarioProf.activo = true;
      this.actualizarCuentaProfesional(this.usuarioProf);
    }
  }




  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();
    this.promedioService.deletePuntaje();


  }


}
