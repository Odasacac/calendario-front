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

  data?: VAUResponse;
  showMore = false;
  loading = false; // <-- nuevo flag

  constructor(private dateService: DatesService) {}

  ngOnInit(): void {
    if (this.fecha) {
      this.cargarDatos(this.fecha);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['fecha'] && !changes['fecha'].isFirstChange()) {
      this.cargarDatos(this.fecha);
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
}