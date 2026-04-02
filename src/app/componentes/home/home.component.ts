import { DateVAUComponent } from '../utiles/date-vau/date-vau.component';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../servicios/usuario.service';
import { Router } from '@angular/router';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { DownloadService } from '../../servicios/download.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DateVAUComponent, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  @ViewChild('popup') popupRef!: ElementRef;
  fecha: string = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  today: string = new Date().toISOString().split('T')[0];
  showDatePicker = false;
  usuarioLogueado = false;
  usuarioInvitado = false;
  mostrarOpciones: boolean = false;

  constructor(private usuarioService: UsuarioService, private router: Router, private eRef: ElementRef, private downloadService: DownloadService){}

  ngOnInit() {

    if(this.usuarioService.getUsuario()){
      this.usuarioLogueado = true;
    }
    else if(this.usuarioService.getEsInvitado()){
      this.usuarioInvitado = this.usuarioService.getEsInvitado()
    }
    else{
      this.usuarioService.setEsInvitado(false);
      this.usuarioService.setUsuario(null);
      this.router.navigate(['/forbidden']);
    }
 
  }

  toggleOpciones(event: Event) {
    event.stopPropagation();
    this.mostrarOpciones = !this.mostrarOpciones;
    this.showDatePicker= false;
  }

  descargarManual() {
     
      this.downloadService.getPDF().subscribe({
      next: (res) => {
        // Descargar el pdf. Mostrar un popup: "PDF explicativo descargado con éxito."
      },
      error: (err) => {
        // Mostrar un popup: "No se ha podido descargar"
      }
    });
  }

  descargarCalendario() {
     
      
  }
    

  irAEventos() {
    console.log('Ir a eventos');
    this.mostrarOpciones = false;
  }

  buscarFecha() {
    this.showDatePicker = !this.showDatePicker;
  }

  onFechaSeleccionada(event: any) {
    this.fecha = new Date(event.target.value).toISOString().split('T')[0];
    this.showDatePicker = false;
  }

  volverHoy() {
    this.fecha = this.today;
  }

  goToLogin(){
    this.router.navigate(['/login']);
  }

  // Nuevo: actualizar fecha desde el componente hijo
  onFechaDesdeComponenteHijo(nuevaFecha: string) {
    this.fecha = nuevaFecha;
    this.showDatePicker = false;
  }

  @HostListener('document:click', ['$event'])
  clickFuera(event: MouseEvent) {
    if (this.mostrarOpciones && this.popupRef && !this.popupRef.nativeElement.contains(event.target)) {
      this.mostrarOpciones = false;
    }
  }
  
}
