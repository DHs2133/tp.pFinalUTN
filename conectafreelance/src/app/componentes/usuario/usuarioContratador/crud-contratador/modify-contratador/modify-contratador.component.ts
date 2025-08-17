import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioContratador } from '../../../interfaceUsuario/usuario.interface';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioContratadorService } from '../../service/usuario-contratador.service';
import { FileSelectService } from '../../../../../utils/FileSelectService';
import { ImageService } from '../../../../../service/back-end/image.service';
import { noWhitespaceValidator } from '../../../../../utils/ValidadoresPersonalizados';

@Component({
  selector: 'app-modify-contratador',
  imports: [ReactiveFormsModule],
  templateUrl: './modify-contratador.component.html',
  styleUrl: './modify-contratador.component.css'
})
export class ModifyContratadorComponent implements OnInit, OnDestroy {

  // variables--------------------------------------------------------------------------------------
  imagenUrl?: SafeUrl;
  id: string | null = null;
  usuContDefault!: UsuarioContratador;
  destroy$ = new Subject<void>();  // Con esto se va a maneja la desuscripción de los observables cuando se destruya el componente
  // variables--------------------------------------------------------------------------------------

  // servicios--------------------------------------------------------------------------------------
  activatedRoute = inject(ActivatedRoute);
  fb = inject(FormBuilder);
  contService = inject(UsuarioContratadorService);
  manejoArchivo = inject(FileSelectService);
  imageService = inject(ImageService);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  // servicios--------------------------------------------------------------------------------------

  // formulario------------------------------------------------------------------------------------
  formulario = this.fb.nonNullable.group({
    id: [''],
    nombreCompleto: ['', [Validators.required, noWhitespaceValidator()]],
    email: ['', [Validators.required, Validators.email]],
    contrasenia: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/)]],
    activo: [true],
    urlFoto: ['', [Validators.required]],
    rol: ['contratador' as 'profesional' | 'contratador' | 'administrador'],
    empresaRepresentada: ["", [noWhitespaceValidator()]]
  });
  // formulario------------------------------------------------------------------------------------

  ngOnInit(): void {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
       next: (param) => {
        this.id = param.get('id');
        if (this.id) {
          this.getUsuarioContratadorById(this.id);
        }
      },
      error: (err) => console.error(err),
    });
  }

  ngOnDestroy(): void {

    this.destroy$.next(); // Desencadena la desuscripción de todo.
    this.destroy$.complete(); // Si bien no tengo un callback definido para complete, por lo que no se va a desencadenar ninguna lógica, leí que es buena práctica escribirlo igual.
  }

  getUsuarioContratadorById(id: string) {
    this.contService.getUsuariosContratadoresPorId(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (usuCont: UsuarioContratador) => {

        this.usuContDefault = usuCont;
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
      id: this.usuContDefault.id,
      nombreCompleto: this.usuContDefault.nombreCompleto,
      email: this.usuContDefault.email,
      contrasenia: this.usuContDefault.contrasenia,
      activo: this.usuContDefault.activo,
      empresaRepresentada: this.usuContDefault.empresaRepresentada,
      urlFoto: this.usuContDefault.urlFoto,
    });
    if (this.usuContDefault.urlFoto) {
      this.cargarImagen(this.usuContDefault.urlFoto);
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

    const usuContMod = this.formulario.getRawValue();
    const newFile = this.manejoArchivo.getArchivoSeleccionado();

    if (newFile) {
      // Actualizar la imagen
      this.imageService.actualizarImagen(newFile, usuContMod.urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          usuContMod.urlFoto = response.urlFoto;
          this.updateUsuario(usuContMod);
        },
        error: (err) => {
          console.error('Error al actualizar la imagen:', err);
          alert('Error al actualizar la imagen');
        },
      });
    } else {
      // Sin nueva imagen, actualizar directamente
      this.updateUsuario(usuContMod);
    }
  }

  updateUsuario(usuContMod: UsuarioContratador) {
    this.contService.putUsuariosContratadores(usuContMod, this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        alert('Usuario actualizado correctamente. Será redirigido a su perfil');
        this.manejoArchivo.clearSelection();
        this.router.navigate(['/perfilContratador']);
      },
      error: (err) => {
        console.error('Error al actualizar el usuario:', err);
        alert('Error al actualizar el usuario');
      },
    });
  }




}
