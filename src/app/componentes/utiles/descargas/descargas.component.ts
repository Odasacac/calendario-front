import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { DownloadService } from '../../../servicios/download.service';

@Component({
  selector: 'app-descargas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './descargas.component.html',
  styleUrl: './descargas.component.css'
})
export class DescargasComponent {

  @Output() back = new EventEmitter<string>();

  constructor(private downloadService: DownloadService){}

  backToDateVAU(){
    this.back.emit();
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
      console.log('Descargar calendario... En construccion');
  }
}
