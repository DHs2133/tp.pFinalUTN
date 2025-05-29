import { UsuarioContratadorService } from './../../service/usuario-contratador.service';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { UsuarioContratador } from '../../../interfaceUsuario/usuario.interface';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { VerificacionService } from '../../../../../utils/verificacion-usuario.service';

@Component({
  selector: 'app-add-contratador',
  imports: [ReactiveFormsModule],
  templateUrl: './add-contratador.component.html',
  styleUrl: './add-contratador.component.css'
})
export class AddContratadorComponent {



  @Output()
  emitirUsuarioContratador: EventEmitter<UsuarioContratador> = new EventEmitter();

  fb = inject(FormBuilder);
  verificacionService = inject(VerificacionService);
  usuarioContService = inject(UsuarioContratadorService);

  formularioUsuarioContratador = this.fb.nonNullable.group({
    nombreCompleto: ['',[Validators.required]],
    email: ['',[Validators.required, Validators.email]],
    contrasenia: ['',[Validators.required, Validators.minLength(5), Validators.maxLength(8), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).{8,16}$/)]],
    urlFoto: ["",[Validators.required]],
    empresaRepresentada:[""]
  })

  agregarUsuarioContratador() {
    const datos = this.formularioUsuarioContratador.getRawValue();

    if (this.formularioUsuarioContratador.invalid) {
      // Si el formulario por alguna razón no es válido:
      alert("Formulario no válido");
      // Se emite una alerta
      return;
      // Y no se devuelve nada
    }

    // En caso de que el formulario sea válido, se verifica el email en ambas APIs
    this.verificacionService.verificarUsuarioEnAmbasApis(datos.email).subscribe({

      next: (existe) => {
        if (existe) {
          alert("Ya existe una cuenta registrada con este email.");
        } else {
          const usuarioContratadorNuevo: UsuarioContratador = {
            ...datos,
            rol: "base",
            activo: true
          };

          this.agregarAUsuarioProfesionalBDD(usuarioContratadorNuevo );
          alert("Cuenta contratadora creada con éxito");
        }
      },
      error: (err) => {
        console.error("Error verificando email:", err);
        alert("Ocurrió un error al verificar el email. Intentá nuevamente.");
      }
    });
  }


  agregarAUsuarioProfesionalBDD(usuarioContNuevo: UsuarioContratador){

      this.usuarioContService.postUsuariosContratadores(usuarioContNuevo).subscribe({
        next: () => {
          alert('Usuario creado. Serás redirigido a iniciar sesión');

          ///         this.router.navigate(['./inicioSesion']);  ME FALTARIA IMPLEMENTAR ALGO COMO ESTOOOOO
        },
        error: (e) => {
          console.error('Error al crear el usuario:', e);
        }
      });

  }
}


