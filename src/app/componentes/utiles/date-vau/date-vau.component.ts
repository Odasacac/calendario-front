import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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
  @Output() fechaChange = new EventEmitter<string>(); // <-- emitimos cambios al padre

  fechaActual!: string;
  data?: VAUResponse;
  showMore = false;
  loading = false;

  constructor(private dateService: DatesService) {}

  ngOnInit(): void {
    this.fechaActual = this.fecha;
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
    this.loading = true;
    this.data = undefined;
    this.dateService.getVAU(fecha).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
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

  const [year, month, day] = this.fechaActual.split('-').map(Number);
  const fechaObj = new Date(Date.UTC(year, month - 1, day));

  fechaObj.setUTCDate(fechaObj.getUTCDate() + dias);

  this.fechaActual = [
    String(fechaObj.getUTCFullYear()).padStart(4, '0'), // <-- aquí mantenemos ceros a la izquierda
    String(fechaObj.getUTCMonth() + 1).padStart(2, '0'),
    String(fechaObj.getUTCDate()).padStart(2, '0')
  ].join('-');

  this.showMore = false;

  this.fechaChange.emit(this.fechaActual);
}

  getDescripcionCasalero(): string {
    const c = this.data?.casalero;
    if (!c) return '';


    if (c.tipo.toUpperCase() === 'ECLIPELAR') {
      if (c.deSol) return 'Eclipelar de sol';
      if (c.deLuna) return 'Eclipelar de luna';
      return 'Eclipelar';
    }

  
    if (c.tipo.toUpperCase() === 'METÓNICO') {
      let subtipo = '';

      if (c.inicial) subtipo = 'inicial';
      else if (c.cuartal) subtipo = 'cuartal';
      else if (c.bicuartal) subtipo = 'bicuartal';
      else if (c.tricuartal) subtipo = 'tricuartal';

      let fase = '';
      if (c.nuevo) fase = 'nuevo';
      else if (c.lleno) fase = 'lleno';

      return ['Metónico', subtipo, fase].filter(Boolean).join(' ');
    }

  return '';
}
}