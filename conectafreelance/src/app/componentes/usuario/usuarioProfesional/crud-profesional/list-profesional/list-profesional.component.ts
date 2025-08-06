import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { ImageService } from '../../../../../service/back-end/image.service';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { UsuarioProfesional } from './../../../interfaceUsuario/usuario.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../../../../utils/service/login-service.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-profesional',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './list-profesional.component.html',
  styleUrls: ['./list-profesional.component.css']
})
export class ListProfesionalComponent implements OnInit, OnDestroy {
  // Servicios
  profesionalService = inject(UsuarioProfesionalService);
  imageService = inject(ImageService);
  fb = inject(FormBuilder);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  loginService = inject(LoginService);

  // Variables
  listaUsuariosProfesionales: UsuarioProfesional[] = [];
  listaFiltrada: UsuarioProfesional[] = [];
  imagenPerfil: { [key: string]: SafeUrl } = {};
  private objectUrls: string[] = [];
  rutasPorRol: { [key: string]: string } = {
    profesional: 'profprofperfil',
    contratador: 'contprofperfil',
    admin: 'admprofperfil'
  };
  id: string = "";
  rol: string = "";
  destroy$ = new Subject<void>();

  filtroForm: FormGroup = this.fb.group({
    profesion: [''],
    nombreCompleto: [''],
    pais: [''],
    provincia: [''],
    ciudad: [''],
    orden: ['']
  });

  ngOnInit(): void {
    this.id = this.loginService.getId();
    this.rol = this.loginService.getRol();

    this.profesionalService.getUsuariosProfesionales()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
          this.listaUsuariosProfesionales = value;
          this.listaFiltrada = [...value];
          this.obtenerImagenes();
        },
        error: (err) => console.error('Error al cargar profesionales:', err)
      });


      this.filtroForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(filtros => {
        this.filtrarProfesionales(filtros);
      });
  }

  obtenerImagenes() {
    this.listaFiltrada.forEach((usuProf) => {
      this.obtenerImagenesDelServidor(usuProf);
    });
  }

  obtenerImagenesDelServidor(usuProf: UsuarioProfesional) {

    if (usuProf.urlFoto) {
      const urlFoto = usuProf.urlFoto;
      this.imageService.getImagen(urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrls.push(objectUrl);
          this.imagenPerfil[urlFoto] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: (err) => {
          console.error(`Error al cargar la imagen de perfil ${urlFoto}:`, err);
        }
      });
    }
  }

  formatearPuntaje(promedio: number | undefined): string {
    if (promedio === undefined || promedio === null) {
      return '0/5.0';
    }
    const puntaje = Number.isInteger(promedio) ? promedio.toString() : promedio.toFixed(1);
    return `${puntaje}/5`;
  }

  filtrarProfesionales(filtros: any) {
    const { profesion, nombreCompleto, pais, provincia, ciudad } = filtros;

    this.listaFiltrada = this.listaUsuariosProfesionales.filter(profesional => {
      return (
        (!profesion || profesional.profesion?.toLowerCase().includes(profesion.toLowerCase())) &&
        (!nombreCompleto || profesional.nombreCompleto?.toLowerCase().includes(nombreCompleto.toLowerCase())) &&
        (!pais || profesional.pais?.toLowerCase().includes(pais.toLowerCase())) &&
        (!provincia || profesional.provincia?.toLowerCase().includes(provincia.toLowerCase())) &&
        (!ciudad || profesional.ciudad?.toLowerCase().includes(ciudad.toLowerCase()))
      );
    });

    this.ordenarLista();
  }

  ordenarLista() {
    const orden = this.filtroForm.get('orden')?.value;

    this.listaFiltrada.sort((a, b) => {
      if (orden === 'comentariosMayor') {
        return (b.cantComentarios || 0) - (a.cantComentarios || 0);
      } else if (orden === 'comentariosMenor') {
        return (a.cantComentarios || 0) - (b.cantComentarios || 0);
      } else if (orden === 'promedioMayor') {
        return (b.promedio || 0) - (a.promedio || 0);
      } else if (orden === 'promedioMenor') {
        return (a.promedio || 0) - (b.promedio || 0);
      }
      return 0;
    });
  }

  redirigir(idlistado: string | undefined) {
    if (!idlistado || !this.rol || !this.id) {
      console.error('Parámetros inválidos:', { idlistado, rol: this.rol, id: this.id });
      return;
    }

    if (!['profesional', 'contratador', 'admin'].includes(this.rol)) {
      console.error('Rol no reconocido:', this.rol);
      this.router.navigate(['/error']);
      return;
    }

    if (this.rol === 'profesional' && this.id === idlistado) {
      this.router.navigate(['perfilProfesional']);
      return;
    }

    const ruta = this.rutasPorRol[this.rol];
    this.router.navigate([ruta, idlistado]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imagenPerfil = {};
  }
}
