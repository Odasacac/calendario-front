import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatesService } from '../../../servicios/dates.service';
import { VAUResponse } from '../../../interfaces/vau-response';

@Component({
  selector: 'app-date-vau',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-vau.component.html',
  styleUrl: './date-vau.component.css'
})
export class DateVAUComponent implements OnInit, OnChanges {

  @Input() fecha!: string;

  fechaActual!: string;
  data?: VAUResponse;
  showMore = false;
  loading = false; // <-- nuevo flag

  constructor(private dateService: DatesService) {}

  ngOnInit(): void {
  this.fechaActual = this.fecha; // inicializamos desde el input
  if (this.fechaActual) {
    this.cargarDatos(this.fechaActual);
  }
}
  ngOnChanges(changes: SimpleChanges): void {
  if (changes['fecha'] && !changes['fecha'].isFirstChange()) {
    this.fechaActual = this.fecha;
    this.cargarDatos(this.fechaActual);
    this.showMore = false;
  }
}

  cargarDatos(fecha: string) {
    this.loading = true; // inicio del spinner
    this.data = undefined; // limpiar datos antiguos
    this.dateService.getVAU(fecha).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false; // fin del spinner
      },
      error: (err) => {
        console.error(err);
        this.loading = false; // fin del spinner también en error
      }
    });
  }

  toggleMore() {
    this.showMore = !this.showMore;
  }

  formatFecha(fecha: string): string {
    const [year, month, day] = fecha.split('-');
    return `${day}-${month}-${year}`;
  }

cambiarFecha(dias: number) {
  if (!this.fechaActual) return;

  // Parseamos la fecha actual como UTC
  const [year, month, day] = this.fechaActual.split('-').map(Number);
  const fechaObj = new Date(Date.UTC(year, month - 1, day));

  // Sumamos o restamos días
  fechaObj.setUTCDate(fechaObj.getUTCDate() + dias);

  // Convertimos de nuevo a yyyy-mm-dd
  this.fechaActual = [
    fechaObj.getUTCFullYear(),
    String(fechaObj.getUTCMonth() + 1).padStart(2, '0'),
    String(fechaObj.getUTCDate()).padStart(2, '0')
  ].join('-');

  // Recargamos los datos con la nueva fecha
  this.cargarDatos(this.fechaActual);

  // Cerramos sección "más"
  this.showMore = false;
}
}