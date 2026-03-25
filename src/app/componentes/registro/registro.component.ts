import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {
 nombre = '';
  apellido = '';
  correo = '';
  fecha = '';

  constructor(private router: Router) {}

  createAccount(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    // TO DO
  }

  goLogin() {
    this.router.navigate(['/login']);
  }
}
