import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../servicios/usuario.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  constructor(private router: Router, private usuarioService: UsuarioService) {}

  user = '';
  password = '';
  

  goHome(form: NgForm) {
    if (form.invalid) {
      form.control.markAllAsTouched();
      return;
    }
    else{
      alert('Login por usuario pendiente, entrar como invitado');
    }
  
  }

  goRegister() {
    this.router.navigate(['/register']);
  }

  goRecovery() {
    this.router.navigate(['/recovery']);
  }

  entrarComoInvitado(){
    this.usuarioService.setEsInvitado(true);
    this.router.navigate(['/home']);
  }

}