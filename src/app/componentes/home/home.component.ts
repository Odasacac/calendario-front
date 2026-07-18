import { DateVAUComponent } from '../utiles/date-vau/date-vau.component';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../servicios/usuario.service';
import { Router } from '@angular/router';
import { Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { DescargasComponent } from '../utiles/descargas/descargas.component';
import { opciones } from '../../interfaces/opciones';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [DateVAUComponent, CommonModule, DescargasComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

  @ViewChild('popup') popupRef!: ElementRef;
  fecha: string = '';
  today: string = '';
  showDatePicker = false;
  usuarioLogueado = false;
  usuarioInvitado = false;
  mostrarOpciones: boolean = false;
  vauContainerView: boolean = true;
  descargarView: boolean = false;
  opciones: opciones[] = [];
  descargarDocumentosOpcion: opciones = {name:'Descargar documentos', value: 1, loggedUserOnly: false};
  eventosResenyablesOpcion: opciones = {name:'Ir a eventos reseñables', value: 2, loggedUserOnly: true};
  fechaVAUOpcion: opciones = {name:'Ir a fecha VAU', value: 3, loggedUserOnly: false};

  constructor(private usuarioService: UsuarioService, private router: Router, private eRef: ElementRef){}

  ngOnInit() {

    if(this.usuarioService.getUsuario()){
      this.usuarioLogueado = true;
    }
    else if(this.usuarioService.getEsInvitado()){
      this.usuarioInvitado = this.usuarioService.getEsInvitado()
    }
    else{
      this.usuarioService.setEsInvitado(false);
      this.usuarioService.setUsuario(null);
      this.router.navigate(['/forbidden']);
    }

    this.updateOptionsVauView();
 
  }

  updateOptionsVauView(){
    this.opciones=[];
    this.opciones.push(this.descargarDocumentosOpcion);
    this.opciones.push(this.eventosResenyablesOpcion);
  }

   updateOptionsDescargasView(){
    this.opciones=[];
    this.opciones.push(this.fechaVAUOpcion);
    this.opciones.push(this.eventosResenyablesOpcion);
  }

  toggleOpciones(event: Event) {
    event.stopPropagation();
    this.mostrarOpciones = !this.mostrarOpciones;
    this.showDatePicker= false;
  }

  mostrarOpcion(loggedUserOnly: boolean): boolean{

    let mostrar: boolean = true;

    if (loggedUserOnly){
      mostrar = this.usuarioLogueado;
    } 

    return mostrar;
  }


  opcionClickada(opcion:number){

    switch(opcion){
      case 1:
        this.goToDescargarDocumentos();
        break;

      case 2:
        this.irAEventos();;
        break;

      case 3:
        this.goToVauContainer();
        break;
    }
  }

  goToDescargarDocumentos(){
    this.updateOptionsDescargasView();
    
    this.vauContainerView=false;
    this.descargarView=true;

    this.mostrarOpciones=false;
  }

  goToVauContainer(){

    this.updateOptionsVauView();

    this.vauContainerView=true;
    this.descargarView=false;

    this.mostrarOpciones=false;
  }

  irAHaceX(){
    console.log('Ir a Hace X... En construccion');
    this.mostrarOpciones = false;
  }

  irADentroDeX(){
    console.log('Ir a Dentro de X... En construccion');
    this.mostrarOpciones = false;
  }
    

  irAEventos() {
    console.log('Ir a eventos... En construccion');
    this.mostrarOpciones = false;
  }

  buscarFecha() {
    this.showDatePicker = !this.showDatePicker;
  }

  onFechaSeleccionada(event: any) {
    this.fecha = new Date(event.target.value).toISOString().split('T')[0];
    this.showDatePicker = false;
  }

  volverHoy() {
    this.fecha = new Date().toISOString().split('T')[0];
    this.fecha = this.today;
  }

  goToLogin(){
    this.router.navigate(['/login']);
  }


  onFechaDesdeComponenteHijo(nuevaFecha: string) {
    this.fecha = nuevaFecha;
    this.showDatePicker = false;
  }

  @HostListener('document:click', ['$event'])
  clickFuera(event: MouseEvent) {
    if (this.mostrarOpciones && this.popupRef && !this.popupRef.nativeElement.contains(event.target)) {
      this.mostrarOpciones = false;
    }
  }

  setToday(today: string){
    this.today = today;
    this.fecha = today;
  }
  
}
