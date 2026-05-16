import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-descargas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './descargas.component.html',
  styleUrl: './descargas.component.css'
})
export class DescargasComponent {

  @Output() back = new EventEmitter<string>();

  backToDateVAU(){
    this.back.emit();
  }
}
