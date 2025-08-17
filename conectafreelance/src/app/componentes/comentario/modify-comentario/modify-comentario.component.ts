import { Component, inject, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { Comentario } from '../interfaceComentario/interface-comentario';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ComentarioService } from '../serviceComentario/comentario.service';
import { noWhitespaceValidator } from '../../../utils/ValidadoresPersonalizados';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modify-comentario',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './modify-comentario.component.html',
  styleUrl: './modify-comentario.component.css'
})
export class ModifyComentarioComponent implements OnInit, OnDestroy {

  // Variables
  idComentario: string | null = null;
  destroy$ = new Subject<void>();
  comentarioAModificar!: Comentario;

  // Servicios
  activatedRoute = inject(ActivatedRoute);
  fb = inject(FormBuilder);
  comentarioService = inject(ComentarioService);
  router = inject(Router);

    // Formulario
  formulario = this.fb.nonNullable.group({

    id: ['', [Validators.required]],
    idCreador: ['', [Validators.required]],
    idDestinatario: ['', [Validators.required]],
    contenido: ['', [Validators.required, Validators.maxLength(500), noWhitespaceValidator()]],
    estado: ['activa' as "activa", [Validators.required]],
    reportada: [false, [Validators.required]],
    puntaje: [0, [Validators.required]],

  });

  ngOnInit(): void {
    this.activatedRoute.paramMap.pipe(takeUntil(this.destroy$)).subscribe({
      next: (param) => {
        this.idComentario = param.get('id');
        if (this.idComentario) {

          this.getComentarioById(this.idComentario);
        }
      },
      error: (err) => {
        console.error('Error al obtener parámetros de la ruta:', err);
        this.router.navigate(['/perfilProfesional']);
      },
    });
  }

  getComentarioById(idComentario: string) {
    this.comentarioService.getComentarioPorIDcomentario(idComentario).pipe(takeUntil(this.destroy$)).subscribe({
      next: (coment) => {
        this.comentarioAModificar = coment;
        console.log(this.comentarioAModificar)
        this.formularioDefecto();

      },
      error: (err) => {
        alert('No se pudo obtener la publicación a modificar. Será redirigido');
        console.error('Error al obtener la publicación:', err);
        this.router.navigate(['/perfilProfesional']);
      },
    });
  }

  formularioDefecto() {
    if (this.comentarioAModificar) {
      this.formulario.patchValue({
        id: this.comentarioAModificar.id,
        idCreador: this.comentarioAModificar.idCreador,
        idDestinatario: this.comentarioAModificar.idDestinatario,
        contenido: this.comentarioAModificar.contenido,
        reportada: this.comentarioAModificar.reportada,
        puntaje: this.comentarioAModificar.puntaje

      });
    }
  }

  reestablecer() {
    this.formulario.patchValue({
      contenido: this.comentarioAModificar.contenido,
    });
  }

  update() {
    if (this.formulario.invalid) {
      alert('Formulario inválido');
      return;
    }

    const datos = this.formulario.getRawValue();

    this.updateComentario(datos);
  }

  updateComentario(comModificada: Comentario) {
    if (this.idComentario) {
      this.comentarioService.putComentario(comModificada, this.idComentario).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          alert('Comentario modificado con éxito');
          this.router.navigate(['/contprofperfil', this.comentarioAModificar.idDestinatario]);
        },
        error: (err) => {
          alert('El comentario no ha podido ser modificado');
          console.error('Error al modificar el comentario:', err);
        },
      });
    }
  }

  contentLength(): number {
    return this.formulario.get('contenido')?.value?.length || 0;
  }



  restrictLength(event: Event): void {
    const input = event.target as HTMLTextAreaElement;
    if (input.value.length > 500) {
      input.value = input.value.slice(0, 500);
      this.formulario.get('contenido')?.setValue(input.value);
      this.formulario.get('contenido')?.markAsTouched();
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
