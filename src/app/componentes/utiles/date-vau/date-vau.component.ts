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
  @Input() esHoy!: boolean;
  @Output() fechaChange = new EventEmitter<string>(); 
  @Output() setToday = new EventEmitter<string>(); 

  fechaActual!: string;
  data?: VAUResponse;
  showMore = false;
  loading = false;
  mensajeError = false;

  constructor(private dateService: DatesService) {}

  ngOnInit(): void {
    this.fechaActual = this.fecha;
    this.cargarDatos(this.fechaActual);
   
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
    this.mensajeError=false;
    if(this.esHoy){
      this.dateService.getTodayVAU().subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.setToday.emit(this.data.fechaO!);
        this.fechaActual = this.data.fechaO!;
        if(!this.data.fechaEncontrada){
          this.mensajeError=true;
        }
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
      });
    }
    else{
      this.dateService.getVAU(fecha).subscribe({
      next: (res) => {
        this.data = res;
        this.loading = false;
        this.fechaActual = this.data.fechaO!;
        if(!this.data.fechaEncontrada){
          this.mensajeError=true;
        }
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
      });
    }
    
  }

  toggleMore() {
    this.showMore = !this.showMore;
  }

  formatFecha(fecha: string): string {
    let fechaParaFormatear = fecha;
    if(!fecha){
      fechaParaFormatear=this.fechaActual;
    }    
    const [year, month, day] = fechaParaFormatear.split('-');
    return `${day}-${month}-${year}`;
  }

  cambiarFecha(dias: number) {
    this.mensajeError=false;
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

      if (c.invernal) subtipo = 'invernal';
      else if (c.primaveral) subtipo = 'primaveral';
      else if (c.estival) subtipo = 'estival';
      else if (c.otonyal) subtipo = 'otoñal';

      let fase = '';
      if (c.nuevo) fase = 'nuevo';
      else if (c.lleno) fase = 'lleno';

      return ['Metónico', subtipo, fase].filter(Boolean).join(' ');
    }

  return '';
}
}