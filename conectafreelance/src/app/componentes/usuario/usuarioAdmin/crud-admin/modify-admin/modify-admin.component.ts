import { Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { UsuarioAdministrador } from '../../../interfaceUsuario/usuario.interface';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioAdministradorService } from '../../service/usuario-administrador.service';
import { FileSelectService } from '../../../../../utils/FileSelectService';
import { ImageService } from '../../../../../service/back-end/image.service';
import { noWhitespaceValidator } from '../../../../../utils/ValidadoresPersonalizados';

@Component({
  selector: 'app-modify-admin',
  imports: [ReactiveFormsModule],
  templateUrl: './modify-admin.component.html',
  styleUrl: './modify-admin.component.css'
})
export class ModifyAdminComponent implements OnInit, OnDestroy{


  // variables--------------------------------------------------------------------------------------
  imagenUrl!: SafeUrl;
  id: string | null = null;
  usuAdmDefault!: UsuarioAdministrador;
  destroy$ = new Subject<void>();  // Con esto se va a maneja la desuscripción de los observables cuando se destruya el componente
  // variables--------------------------------------------------------------------------------------

  // servicios--------------------------------------------------------------------------------------
  activatedRoute = inject(ActivatedRoute);
  fb = inject(FormBuilder);
  admService = inject(UsuarioAdministradorService);
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
    rol: ['administrador' as 'profesional' | 'contratador' | 'administrador'],
    permisos: [1 as 1 | 2 | 3, [Validators.required]]
  });
  // formulario------------------------------------------------------------------------------------

  ngOnInit(): void {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
       next: (param) => {
        this.id = param.get('id');
        if (this.id) {
          this.getUsuarioAdmById(this.id);
        }
      },
      error: (err) => console.error(err),
    });
  }


  getUsuarioAdmById(id: string) {
    this.admService.getUsuariosAdministradoresPorID(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (usuAdm: UsuarioAdministrador) => {

        this.usuAdmDefault = usuAdm;
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
      id: this.usuAdmDefault.id,
      nombreCompleto: this.usuAdmDefault.nombreCompleto,
      email: this.usuAdmDefault.email,
      contrasenia: this.usuAdmDefault.contrasenia,
      activo: this.usuAdmDefault.activo,
      urlFoto: this.usuAdmDefault.urlFoto,
      permisos: this.usuAdmDefault.permisos
    });
    if (this.usuAdmDefault.urlFoto) {
      this.cargarImagen(this.usuAdmDefault.urlFoto);
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

    const usuAdmMod = this.formulario.getRawValue();
    const newFile = this.manejoArchivo.getArchivoSeleccionado();

    if (newFile) {
      // Actualizar la imagen
      this.imageService.actualizarImagen(newFile, usuAdmMod.urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (response) => {
          usuAdmMod.urlFoto = response.urlFoto;
          this.updateUsuario(usuAdmMod);
        },
        error: (err) => {
          console.error('Error al actualizar la imagen:', err);
          alert('Error al actualizar la imagen');
        },
      });
    } else {
      // Sin nueva imagen, actualizar directamente
      this.updateUsuario(usuAdmMod);
    }
  }

  updateUsuario(usuAdmMod: UsuarioAdministrador) {
    this.admService.putUsuariosAdministradores(usuAdmMod, this.id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        alert('Usuario actualizado correctamente. Será redirigido a su perfil');
        this.manejoArchivo.clearSelection();
        this.router.navigate(['/perfilAdmin']);
      },
      error: (err) => {
        console.error('Error al actualizar el usuario:', err);
        alert('Error al actualizar el usuario');
      },
    });
  }

  ngOnDestroy(): void {

    this.destroy$.next(); // Desencadena la desuscripción de todo.
    this.destroy$.complete(); // Si bien no tengo un callback definido para complete, por lo que no se va a desencadenar ninguna lógica, leí que es buena práctica escribirlo igual.
  }



}
