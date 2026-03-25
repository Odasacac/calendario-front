import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-recovery',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './recovery.component.html',
  styleUrl: './recovery.component.css'
})
export class RecoveryComponent {

 userEmail = '';

  constructor(private router: Router) {}

  recoverPassword(form: NgForm) {
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
