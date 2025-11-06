import { Component, inject } from '@angular/core';
import { UsuarioContratador } from '../../../interfaceUsuario/usuario.interface';
import { UsuarioContratadorService } from '../../service/usuario-contratador.service';
import { ImageService } from '../../../../../service/back-end/image.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { LoginService } from '../../../../../utils/service/login-service.service';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-list-contratador',
  imports: [ReactiveFormsModule],
  templateUrl: './list-contratador.component.html',
  styleUrl: './list-contratador.component.css'
})

export class ListContratadorComponent {


  contratadorService = inject(UsuarioContratadorService);
  imageService = inject(ImageService);
  fb = inject(FormBuilder);
  sanitizer = inject(DomSanitizer);
  router = inject(Router);
  loginService = inject(LoginService);

  listaUsuariosContratadores: UsuarioContratador[] = [];
  listaFiltrada: UsuarioContratador[] = [];
  imagenPerfil: { [key: string]: SafeUrl } = {};
  objectUrls: string[] = [];

  id: string = "";
  rol: string = "";
  destroy$ = new Subject<void>();


  // t.odos, independientes, empresa
  filtroForm: FormGroup = this.fb.group({
    tipoFiltro: ['todos'],
    nombreCompleto: [''],
    empresaRepresentada: ['']
  });

  ngOnInit(): void {
    this.id = this.loginService.getId();
    this.rol = this.loginService.getRol();


    this.cargarContratadores();

    this.filtroForm.get('tipoFiltro')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(tipo => {
        const empresaControl = this.filtroForm.get('empresaRepresentada');
        if (tipo === 'independientes') {
          empresaControl?.disable({ emitEvent: false });
          empresaControl?.setValue('', { emitEvent: false });
        } else {
          empresaControl?.enable({ emitEvent: false });
        }
      });


    this.filtroForm.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(filtros => this.filtrarContratadores(filtros));
  }

  cargarContratadores() {
    this.contratadorService.getUsuariosContratadores()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (value) => {
          this.listaUsuariosContratadores = value;
          this.listaFiltrada = [...value];
          this.obtenerImagenes();
        },
        error: (err) => console.error('Error al cargar contratadores:', err)
      });
  }

  obtenerImagenes() {
    this.listaFiltrada.forEach(usu => this.obtenerImagenesDelServidor(usu));
  }

  obtenerImagenesDelServidor(usu: UsuarioContratador) {
    if (usu.urlFoto) {
      this.imageService.getImagen(usu.urlFoto).pipe(takeUntil(this.destroy$)).subscribe({
        next: (blob) => {
          const objectUrl = URL.createObjectURL(blob);
          this.objectUrls.push(objectUrl);
          this.imagenPerfil[usu.urlFoto] = this.sanitizer.bypassSecurityTrustUrl(objectUrl);
        },
        error: (err) => console.error(`Error imagen ${usu.urlFoto}:`, err)
      });
    }
  }

  filtrarContratadores(filtros: any) {
    const { tipoFiltro, nombreCompleto, empresaRepresentada } = filtros;

    const nombreFiltro = nombreCompleto?.trim().toLowerCase() || '';
    const empresaFiltro = empresaRepresentada?.trim().toLowerCase() || '';

    this.listaFiltrada = this.listaUsuariosContratadores.filter(c => {
      let cumpleTipo = true;
      if (tipoFiltro === 'independientes') {
        cumpleTipo = !c.empresaRepresentada;
      } else if (tipoFiltro === 'empresa') {
        cumpleTipo = !!c.empresaRepresentada;
      }

      const coincideNombre = !nombreFiltro ||
        (c.nombreCompleto?.toLowerCase().includes(nombreFiltro) ?? false);

      const coincideEmpresa = tipoFiltro === 'independientes' || !empresaFiltro ||
        (c.empresaRepresentada?.toLowerCase().includes(empresaFiltro) ?? false);

      return cumpleTipo && coincideNombre && coincideEmpresa;
    });
  }

  redirigir(idlistado: string | undefined) {
    if (!idlistado) return;
    this.router.navigate(['admin/perfAdmCont', idlistado]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.objectUrls.forEach(url => URL.revokeObjectURL(url));
    this.objectUrls = [];
    this.imagenPerfil = {};
  }

}
