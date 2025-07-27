import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioProfesionalService } from '../../service/usuario-profesional.service';
import { FileSelectService } from '../../../../../utils/FileSelectService';
import { ImageService } from '../../../../../service/back-end/image.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioProfesional } from './../../../interfaceUsuario/usuario.interface';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-modify-profesional',
  imports: [ReactiveFormsModule],
  templateUrl: './modify-profesional.component.html',
  styleUrl: './modify-profesional.component.css'
})

export class ModifyProfesionalComponent implements OnInit, OnDestroy {


  // variables--------------------------------------------------------------------------------------
  imagenUrl?: SafeUrl;
  id: string | null = null;
  usuProfDefault!: UsuarioProfesional;
  destroy$ = new Subject<void>();  // Con esto se va a maneja la desuscripción de los observables cuando se destruya el componente
  // variables--------------------------------------------------------------------------------------


  // servicios--------------------------------------------------------------------------------------
  activatedRoute = inject(ActivatedRoute);
  fb = inject(FormBuilder);
  proService = inject(UsuarioProfesionalService);
  manejoArchivo = inject(FileSelectService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  // servicios--------------------------------------------------------------------------------------


  // formulario------------------------------------------------------------------------------------
  formulario = this.fb.nonNullable.group({
    id: [''],
    nombreCompleto: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    contrasenia: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/)]],
    activo: [true],
    profesion: ['', [Validators.required]],
    descripcion: ['', [Validators.required, Validators.maxLength(1000)]],
    ciudad: ['', Validators.required],
    provincia: ['', Validators.required],
    pais: ['', Validators.required],
    promedio: [0, [Validators.required]],
    cantComentarios: [0, [Validators.required]],
    urlFoto: ['', [Validators.required]],
    rol: ['profesional' as 'profesional' | 'contratador' | 'administrador'],
  });
  // formulario------------------------------------------------------------------------------------

  ngOnInit(): void {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.id = param.get('id');
        if (this.id) {
          this.getUsuarioProfesionalById(this.id);
        }
      },
      error: (err) => console.error(err),
    });
  }

  ngOnDestroy(): void {

    this.destroy$.next(); // Desencadena la desuscripción de todo.
    this.destroy$.complete(); // Si bien no tengo un callback definido para complete, por lo que no se va a desencadenar ninguna lógica, leí que es buena práctica escribirlo igual.
  }

  getUsuarioProfesionalById(id: string) {
    this.proService.getUsuariosProfesionalPorID(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (usuProf: UsuarioProfesional) => {

        this.usuProfDefault = usuProf;
        this.formularioDefecto();


      },
      error: (err) => {
        console.error('Error al obtener usuario:', err);
        alert('Error al cargar el usuario');
      },
    });
  }

  reestablecer(){

    this.formularioDefecto();
    this.manejoArchivo.clearSelection();

  }

  formularioDefecto(){

    this.formulario.patchValue({
      id: this.usuProfDefault.id,
      nombreCompleto: this.usuProfDefault.nombreCompleto,
      email: this.usuProfDefault.email,
      contrasenia: this.usuProfDefault.contrasenia,
      activo: this.usuProfDefault.activo,
      profesion: this.usuProfDefault.profesion,
      descripcion: this.usuProfDefault.descripcion,
      ciudad: this.usuProfDefault.ciudad,
      provincia: this.usuProfDefault.provincia,
      pais: this.usuProfDefault.pais,
      promedio: this.usuProfDefault.promedio,
      cantComentarios: this.usuProfDefault.cantComentarios,
      urlFoto: this.usuProfDefault.urlFoto,
    });
    if (this.usuProfDefault.urlFoto) {
      this.cargarImagen(this.usuProfDefault.urlFoto);
    }

  }

  cargarImagen(fileName: string) {
    this.imageService.getImagen(fileName).pipe(takeUntil(this.destroy$)).subscribe({
      next: (blob: Blob) => {
        const objectUrl = URL.createObjectURL(blob);
        this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      },
      error: (err) => {
        console.error('Error al cargar la imagen:', err);
        alert('Error al cargar la imagen');
      },
    });
  }

  manejoDeArchivo(event: Event) {
    this.manejoArchivo.onFileChange(event);
    const previewUrl = this.manejoArchivo.getImagePreviewUrl();
    if (previewUrl) {
      this.imagenUrl = this.sanitizer.bypassSecurityTrustUrl(previewUrl);
    }
  }

  update() {
    if (this.formulario.invalid) {
      alert('Formulario inválido');
      return;
    }

    const usuProfMod = this.formulario.getRawValue();
    const newFile = this.manejoArchivo.getArchivoSeleccionado();

    if (newFile) {
      // Actualizar la imagen
      this.imageService.actualizarImagen(newFile, usuProfMod.urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          usuProfMod.urlFoto = response.urlFoto;
          this.updateUsuario(usuProfMod);
        },
        error: (err) => {
          console.error('Error al actualizar la imagen:', err);
          alert('Error al actualizar la imagen');
        },
      });
    } else {
      // Sin nueva imagen, actualizar directamente
      this.updateUsuario(usuProfMod);
    }
  }

  updateUsuario(usuProfMod: UsuarioProfesional) {
    this.proService.putUsuariosProfesionales(usuProfMod, this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        alert('Usuario actualizado correctamente. Será redirigido a su perfil');
        this.manejoArchivo.clearSelection();
        this.router.navigate(['/perfilProfesional']);
      },
      error: (err) => {
        console.error('Error al actualizar el usuario:', err);
        alert('Error al actualizar el usuario');
      },
    });
  }
}
