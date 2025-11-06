import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, catchError, of, forkJoin } from 'rxjs';
import { ImageService } from '../../../../../service/back-end/image.service';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { UsuarioProfesional } from './../../../interfaceUsuario/usuario.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router, RouterModule } from '@angular/router';
import { LoginService } from '../../../../../utils/service/login-service.service';
import { CommonModule } from '@angular/common';
import { ComentarioService } from '../../../../comentario/serviceComentario/comentario.service';
import { Comentario } from '../../../../comentario/interfaceComentario/interface-comentario';

@Component({
  selector: 'app-list-profesional',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './list-profesional.component.html',
  styleUrls: ['./list-profesional.component.css']
})
export class ListProfesionalComponent implements OnInit, OnDestroy {

  profesionalService = inject(UsuarioProfesionalService);
  imageService = inject(ImageService);
  fb = inject(FormBuilder);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  loginService = inject(LoginService);
  comentarioService = inject(ComentarioService);

  listaUsuariosProfesionales: UsuarioProfesional[] = [];
  listaFiltrada: UsuarioProfesional[] = [];

  imagenPerfil: { [key: string]: SafeUrl } = {};
  objectUrls: string[] = [];

  comentariosPorProfesional: { [idProf: string]: Comentario[] } = {};

  rutasPorRol: { [key: string]: string } = {
    profesional: 'profesional/profprofperfil',
    contratador: 'contratador/contprofperfil',
    admin: 'admin/admprofperfil'
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

    this.cargarProfesionales();

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

  cargarProfesionales() {
    this.profesionalService.getUsuariosProfesionales()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
          this.listaUsuariosProfesionales = value;
          this.listaFiltrada = [...value];
          this.obtenerImagenes();
          this.calcularPromedioYComentarios();
        },
        error: (err) => console.error('Error al cargar profesionales:', err)
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
      if (this.imagenPerfil[urlFoto]) return;

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

  calcularPromedioYComentarios() {
    const idsProfesionales = this.listaFiltrada
      .map(p => p.id)
      .filter(Boolean) as string[];

    if (idsProfesionales.length === 0) return;

    const requests = idsProfesionales.map(id =>
      this.comentarioService.getComentarioPorIDdestinatario(id).pipe(
        catchError(() => of([] as Comentario[]))
      )
    );

    forkJoin(requests).pipe(takeUntil(this.destroy$)).subscribe({
      next: (resultados: Comentario[][]) => {
        resultados.forEach((comentarios, index) => {
          const idProf = idsProfesionales[index];
          this.comentariosPorProfesional[idProf] = comentarios;

          const cant = comentarios.length;
          const suma = comentarios.reduce((acc, c) => acc + c.puntaje, 0);
          const promedio = cant > 0 ? suma / cant : 0;

          const prof = this.listaFiltrada.find(p => p.id === idProf);
          if (prof) {
            prof.cantComentarios = cant;
            prof.promedio = promedio;
          }
        });

        this.ordenarLista();
      },
      error: (err) => {
        console.error('Error al cargar comentarios para promedio:', err);
      }
    });
  }

  filtrarProfesionales(filtros: any) {
    const { profesion, nombreCompleto, pais, provincia, ciudad } = filtros;

    const termino = profesion ? profesion.trim().toLowerCase() : '';
    const nombreFiltro = nombreCompleto ? nombreCompleto.trim().toLowerCase() : '';

    this.listaFiltrada = this.listaUsuariosProfesionales.filter(profesional => {
      const prof = (profesional.profesion || '').toLowerCase();

      const coincideDirecto = !termino || prof.startsWith(termino);

      let coincideGeneroOpuesto = false;
      if (termino && !coincideDirecto) {
        const reglasGenero: { [sufijo: string]: string } = {
          'a': 'o', 'o': 'a', 'ora': 'or', 'or': 'ora',
          'era': 'ero', 'ero': 'era', 'esa': 'és', 'és': 'esa',
          'triz': 'tor', 'tor': 'triz', 'iz': 'iz'
        };

        const sufijos = Object.keys(reglasGenero).sort((a, b) => b.length - a.length);
        for (const sufijo of sufijos) {
          if (termino.endsWith(sufijo)) {
            const base = termino.slice(0, -sufijo.length);
            const opuesto = reglasGenero[sufijo];
            const terminoOpuesto = base + opuesto;
            if (prof.startsWith(terminoOpuesto)) {
              coincideGeneroOpuesto = true;
              break;
            }
          }
        }
      }

      const coincideProfesion = coincideDirecto || coincideGeneroOpuesto;
      const coincideNombre = !nombreFiltro || (profesional.nombreCompleto?.toLowerCase().startsWith(nombreFiltro) ?? false);
      const coincidePais = !pais || profesional.pais?.toLowerCase().includes(pais.toLowerCase());
      const coincideProvincia = !provincia || profesional.provincia?.toLowerCase().includes(provincia.toLowerCase());
      const coincideCiudad = !ciudad || profesional.ciudad?.toLowerCase().includes(ciudad.toLowerCase());

      return coincideProfesion && coincideNombre && coincidePais && coincideProvincia && coincideCiudad;
    });

    this.ordenarLista();
    this.calcularPromedioYComentarios();
  }

  ordenarLista() {
    const orden = this.filtroForm.get('orden')?.value;

    this.listaFiltrada.sort((a, b) => {
      if (orden === 'comentariosMayor') {
        return (b.cantComentarios || 0) - (a.cantComentarios || 0);
      } else if (orden === 'comentariosMenMenor') {
        return (a.cantComentarios || 0) - (b.cantComentarios || 0);
      } else if (orden === 'promedioMayor') {
        return (b.promedio || 0) - (a.promedio || 0);
      } else if (orden === 'promedioMenor') {
        return (a.promedio || 0) - (b.promedio || 0);
      }
      return 0;
    });
  }

  formatearPuntaje(promedio: number | undefined): string {
    if (promedio === undefined || promedio === null || promedio === 0) {
      return '0/5';
    }
    const fixed = promedio % 1 === 0 ? promedio.toString() : promedio.toFixed(1);
    return `${fixed}/5`;
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
      this.router.navigate(['profesional/perfil']);
      return;
    }

    const ruta = this.rutasPorRol[this.rol];
    this.router.navigate([ruta, idlistado]);
  }

  esProfesionalActivo(profesional: UsuarioProfesional): boolean {
    return profesional.activo === true;
  }

  usuSesionEsAdmin(): boolean {
    return this.rol === 'admin';
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imagenPerfil = {};
    this.comentariosPorProfesional = {};
  }
}
