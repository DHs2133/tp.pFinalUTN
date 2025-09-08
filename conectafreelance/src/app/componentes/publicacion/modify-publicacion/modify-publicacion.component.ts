import { ImageService } from './../../../service/back-end/image.service';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PublicacionService } from '../servicePublicacion/publicacion.service';
import { Publicacion } from '../interfacePublicacion/publicacion.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { noWhitespaceValidator } from '../../../utils/ValidadoresPersonalizados';
import { UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';

@Component({
  selector: 'app-modify-publicacion',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './modify-publicacion.component.html',
  styleUrls: ['./modify-publicacion.component.css']
})
export class ModifyPublicacionComponent implements OnInit, OnDestroy {
  // Variables
  idPublicacion: string | null = null;
  destroy$ = new Subject<void>();
  publicacionAModificar!: Publicacion;
  imagenPublicacion: SafeUrl | null = null;

  // Servicios
  activatedRoute = inject(ActivatedRoute);
  fb = inject(FormBuilder);
  publicacionService = inject(PublicacionService);
  router = inject(Router);
  imageService = inject(ImageService)
  sanitizer = inject(DomSanitizer);


  // Formulario
  formulario = this.fb.nonNullable.group({
    idPublicacion: ['', [Validators.required]],
    idCreador: ['', [Validators.required]],

    cont: ['', [Validators.required, Validators.maxLength(500), noWhitespaceValidator()]],
    reportada: [false, [Validators.required]],
  });

  ngOnInit(): void {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idPublicacion = param.get('id');
        if (this.idPublicacion) {
          this.getPublicacionById(this.idPublicacion);
        }
      },
      error: (err) => {
        console.error('Error al obtener parámetros de la ruta:', err);
        this.router.navigate(['/perfilProfesional']);
      },
    });
  }

  getPublicacionById(idPublicacion: string) {
    this.publicacionService.getPublicacionPorIDPublicacion(idPublicacion).pipe(takeUntil(this.destroy$)).subscribe({
      next: (publi) => {
        this.publicacionAModificar = publi;
        this.imagenPublicacion = publi.urlFoto ? this.sanitizer.bypassSecurityTrustUrl(publi.urlFoto) : null;
        this.formularioDefecto();
        this.cargarImagenes();

      },
      error: (err) => {
        alert('No se pudo obtener la publicación a modificar. Será redirigido');
        console.error('Error al obtener la publicación:', err);
        this.router.navigate(['/perfilProfesional']);
      },
    });
  }

  cargarImagenes() {

    if (this.publicacionAModificar.urlFoto) {
      this.imageService.getImagen(this.publicacionAModificar.urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (blob: Blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.imagenPublicacion = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
          console.log('Imagen Publicación cargada:', this.imagenPublicacion);
        },
        error: (err) => {
          console.error('Error al cargar urlFoto:', err);
          this.imagenPublicacion = null;
        },
      });
    } else {
      this.imagenPublicacion = null;
    }
  }

  formularioDefecto() {
    if (this.publicacionAModificar) {
      this.formulario.patchValue({
        idPublicacion: this.publicacionAModificar.id,
        idCreador: this.publicacionAModificar.idCreador,
        cont: this.publicacionAModificar.cont,
        reportada: this.publicacionAModificar.reportada,
      });
    }
  }

  reestablecer() {
    this.formulario.patchValue({
      cont: this.publicacionAModificar.cont,
    });
  }

  update() {
    if (this.formulario.invalid) {
      alert('Formulario inválido');
      return;
    }

    const datos = this.formulario.getRawValue();
    const pubModificada: Publicacion = {
      ...datos,
      reportada: this.publicacionAModificar.reportada,
      controlado: false,  // Por más que se haya controlado la publicación, si el usuario la modifica
      // entonces puede que esta publicación modificada ahora sí tenga contenido inadecuado.
      urlFoto: this.publicacionAModificar.urlFoto
    };

    this.updatePublicacion(pubModificada);
  }

  updatePublicacion(publiModificada: Publicacion) {
    if (this.idPublicacion) {
      this.publicacionService.putPublicacion(publiModificada, this.idPublicacion).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          alert('Publicación modificada con éxito');
          this.router.navigate(['/perfilProfesional']);
        },
        error: (err) => {
          alert('La publicación no ha podido ser modificada');
          console.error('Error al modificar la publicación:', err);
        },
      });
    }
  }


  contentLength(): number {
    return this.formulario.get('cont')?.value?.length || 0;
  }



  restrictLength(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    if (input.value.length > 500) {
      input.value = input.value.slice(0, 500);
      this.formulario.get('cont')?.setValue(input.value);
      this.formulario.get('cont')?.markAsTouched();
    }
  }

  autoResize(event: Event) {
    const texpublicacion = event.target as HTMLTextAreaElement;
    texpublicacion.style.height = 'auto';
    texpublicacion.style.height = `${texpublicacion.scrollHeight}px`;
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
