import { Injectable } from '@angular/core';
import { User } from '../interfaces/user';

@Injectable({
  providedIn: 'root'
})
export class UsuarioService {

  constructor() { }

  private esInvitado: boolean = false;
  private usuario: User | null = null;

  getUsuario(): User | null {
    return this.usuario;
  }

  setUsuario(usuario: User | null) {
    this.usuario = usuario;
  }

  getEsInvitado(){
    return this.esInvitado;
  }

  setEsInvitado(esInvitado: boolean){
    this.esInvitado = esInvitado;
  }
}
