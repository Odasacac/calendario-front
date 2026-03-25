import { Component } from '@angular/core';
import { DateVAUComponent } from '../utiles/date-vau/date-vau.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DateVAUComponent, CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  fecha: string = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  today: string = new Date().toISOString().split('T')[0]; // fecha de hoy
  showDatePicker = false;

  openPdf() {
    alert('Abrir PDF (pendiente)');
  }

  buscarFecha() {
    this.showDatePicker = true;
  }
onFechaSeleccionada(event: any) {
  this.fecha = new Date(event.target.value).toISOString().split('T')[0];
  this.showDatePicker = false;
}

  volverHoy() {
    this.fecha = this.today;
  }
}
