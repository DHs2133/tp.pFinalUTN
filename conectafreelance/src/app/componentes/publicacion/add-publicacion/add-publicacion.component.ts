import { Component, inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { PublicacionService } from '../servicePublicacion/publicacion.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ImageService } from '../../../service/back-end/image.service';
import { Router } from '@angular/router';
import { FileSelectService } from '../../../utils/FileSelectService';
import { Publicacion } from '../interfacePublicacion/publicacion.interface';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ListPublicacionComponent } from "../list-publicacion/list-publicacion.component";
import { LoginService } from '../../../utils/service/login-service.service';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-add-publicacion',
  imports: [ReactiveFormsModule, ListPublicacionComponent],
  templateUrl: './add-publicacion.component.html',
  styleUrl: './add-publicacion.component.css'
})
export class AddPublicacionComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  fotoCreador: string = " ";
  nombreUsu: string = " ";
  idCreador: string = " ";
  destroy$ = new Subject<void>();
  publicAAgregar!: Publicacion;

  servicioPubli = inject(PublicacionService);
  fb = inject(FormBuilder);
  uploadImage = inject(ImageService);
  router = inject(Router);
  manejoArchivo = inject(FileSelectService);
  logServ = inject(LoginService);
  usuProfService = inject(UsuarioProfesionalService);
  sanitizer = inject(DomSanitizer);

  imgSrc: string | null = null;

  ngOnInit(): void {
    this.idCreador = this.logServ.getId();
    this.usuProfService.getUsuariosProfesionalPorID(this.idCreador).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (usuario) => {
          this.nombreUsu = usuario.nombreCompleto;
          this.fotoCreador = usuario.urlFoto;
          this.establecerValores();
        },
        error: (err) => {
          console.error("No se pudo obtener el usuario: " + err);
        }
      });
  }

  formPubli = this.fb.nonNullable.group({
    idCreador: [" "],
    nombreCreador: [" "],
    fotoCreador: [" "],
    cont: ["", [Validators.required, Validators.maxLength(500)]],
  });

  establecerValores() {
    this.formPubli.patchValue({
      idCreador: this.idCreador,
      nombreCreador: this.nombreUsu,
      fotoCreador: this.fotoCreador
    });
  }

  manejoDeArchivo(event: any) {
    this.manejoArchivo.onFileChange(event);
    const urlPrevisualizacion = this.manejoArchivo.getImagePreviewUrl();
    if (urlPrevisualizacion) {
      this.imgSrc = urlPrevisualizacion;
    }
  }

  removeImage() {
    this.manejoArchivo.clearSelection();
    this.imgSrc = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  autoResize(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }

  agregarPublicacion() {
    if (this.formPubli.invalid) {
      alert("Formulario inválido");
      return;
    }

    const datosMinPublic = this.formPubli.getRawValue();
    const archivo = this.manejoArchivo.getArchivoSeleccionado();

    if (archivo) {
      this.subirImagen(archivo, datosMinPublic);
    } else {
      const publicacionSinImage: Publicacion = {
        ...datosMinPublic,
        estado: "activa",
        reportada: false
      };
      this.addPublicacion(publicacionSinImage);
    }
  }

  subirImagen(archivo: File, datosMinPublic: any) {
    this.uploadImage.subirImagen(archivo).pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ urlFoto }) => {
        const publicacionConImagen: Publicacion = {
          ...datosMinPublic,
          urlFoto,
          estado: "activa",
          reportada: false
        };
        this.addPublicacion(publicacionConImagen);
      },
      error: (err) => {
        console.error(err);
        alert("Error al subir una imagen.");
      }
    });
  }

  addPublicacion(publicacion: Publicacion) {
    this.servicioPubli.postPublicacion(publicacion).pipe(takeUntil(this.destroy$)).subscribe({
      next: (publicacionCreada) => {
        alert('Publicación creada.');
        this.publicAAgregar = publicacionCreada;
        this.resetear();
      },
      error: (err) => {
        console.log("error: " + err);
        alert("No se pudo subir la publicación");
      },
    });
  }

  contentLength(): number {
    return this.formPubli.get('cont')?.value?.length || 0;
  }

  resetear() {
    this.resetearContFormulario();
    this.removeImage();
  }

  resetearContFormulario() {
    this.formPubli.get('cont')?.setValue('');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
