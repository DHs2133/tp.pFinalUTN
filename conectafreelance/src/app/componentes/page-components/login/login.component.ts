import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsuarioProfesionalService } from '../../usuario/usuarioProfesional/service/usuario-profesional.service';
import { UsuarioContratadorService } from '../../usuario/usuarioContratador/service/usuario-contratador.service';
import { UsuarioAdministradorService } from '../../usuario/usuarioAdmin/service/usuario-administrador.service';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { LoginService } from '../../../utils/service/login-service.service';
import { UsuarioAdministrador, UsuarioContratador, UsuarioProfesional } from '../../usuario/interfaceUsuario/usuario.interface';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterModule],

  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  serviceUsuProf = inject(UsuarioProfesionalService);
  serviceUsuCont = inject(UsuarioContratadorService);
  serviceUsuAdm = inject(UsuarioAdministradorService);
  loginService = inject(LoginService);
  router = inject(Router);


  fb = inject(FormBuilder);

  formularioLogin = this.fb.nonNullable.group({
    email: ["", [Validators.required]],
    password: ["", [Validators.required]]
  })


login() {

  if (!this.formularioLogin.valid) {
    alert('Debe ingresar un correo válido y una contraseña');
    return;
  }

  const email = this.formularioLogin.get('email')?.value ?? '';
  const password = this.formularioLogin.get('password')?.value ?? '';

  // Mapeo de roles a rutas
  const roleRoutes: { [key: string]: string } = {
    profesional: '/perfilProfesional',
    contratador: '/perfilContratador',
    administrador: '/perfilAdmin'
  };

  // Ejecuta las tres peticiones en paralelo
  forkJoin([
    this.serviceUsuProf.getUsuariosProfesionalPorEmail(email),
    this.serviceUsuCont.getUsuariosContratadoresPorEmail(email),
    this.serviceUsuAdm.getUsuariosAdministradoresPorEmail(email)
  ]).subscribe({
    // Se va a tener tres respuestas: respuestaProf, respuestaCont, respuestaAdm
    // Si bien en este contexto no es estrictamente necesario especificar que respuestaProf es
    // un array de UsuarioProfesional, respuestaCont es un array de UsuarioContratador, etc, porque ya esto se indica
    // en el servicio, prefiero que esté aclarado por seguridad.
    next: ([respuestaProf, respuestaCont, respuestaAdm]: [UsuarioProfesional[], UsuarioContratador[], UsuarioAdministrador[]]) => {
      // Una vez obtenidas las respuestas, se combinan todas en un array de tipo UsuarioProfesional|UsuarioContratador|UsuarioAdministrador
      const usuarioValido = [
        ...respuestaProf,
        ...respuestaCont,
        ...respuestaAdm
      ].find((usu) => usu.contrasenia === password);
      // Si bien find se rompe si usu llegara a ser null o undefined, dado que ya se sabe que lo peor que puede
      // ocurrir es que se devuelva simplemente un array vacío, no va a romper.

      if (usuarioValido) {
        this.loginService.setEmail(email); // Llamada única
        const ruta = roleRoutes[usuarioValido.rol];
        this.router.navigate([ruta]);
      } else {
        alert('Email o contraseña incorrectos');
      }
    },
    error: (err) => {
      console.error('Error en el servidor:', err);
      alert('Ha ocurrido un error en el servidor');
    }
  });
}


}
