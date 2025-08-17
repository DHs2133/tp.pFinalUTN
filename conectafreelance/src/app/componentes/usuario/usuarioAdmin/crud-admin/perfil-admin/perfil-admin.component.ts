import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioAdministrador } from '../../../interfaceUsuario/usuario.interface';
import { Subject, takeUntil } from 'rxjs';
import { LoginService } from '../../../../../utils/service/login-service.service';
import { UsuarioAdministradorService } from '../../service/usuario-administrador.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-perfil-admin',
  imports: [],
  templateUrl: './perfil-admin.component.html',
  styleUrl: './perfil-admin.component.css'
})
export class PerfilAdminComponent {

  id: string = '';
  imagenUrl!: SafeUrl;
  activeTab: 'publicReportadas' | 'comentReport' = 'publicReportadas';
  usuarioAdm: UsuarioAdministrador = {

    id: " ",
    nombreCompleto: " ",
    email: " ",
    contrasenia: " ",
    urlFoto: " ",
    activo: true,
    rol: "contratador",
    permisos: []

  }
  destroy$ = new Subject<void>();

  loginService = inject(LoginService);
  admService = inject(UsuarioAdministradorService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);

  ngOnInit() {
    this.id = this.loginService.getId();
    this.traerUsuarioAdministradorDeBDD();
  }

  setActiveTab(tab: 'publicReportadas' | 'comentReport'): void {
    this.activeTab = tab;
  }

  traerUsuarioAdministradorDeBDD() {
    this.admService.getUsuariosAdministradoresPorID(this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (usu: UsuarioAdministrador) => {
        if (usu) {
          this.usuarioAdm = usu;
          this.cargarImagen(this.usuarioAdm.urlFoto);
        } else {
          alert('Ha ocurrido un error. Vuelva a iniciar sesión');
          this.loginService.clear();
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        console.error(err);
        alert('Ha ocurrido un error en el servidor');
      }
    });
  }

  cargarImagen(fileName: string) {
    this.imageService.getImagen(fileName).subscribe({
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


  ngOnDestroy(): void {

    this.destroy$.next();
    this.destroy$.complete();

  }


}
