import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import {
  DESCRIPCION_ACONTECIMIENTO_MAX,
  FECHA_ACONTECIMIENTO_MAX,
  FECHA_ACONTECIMIENTO_MIN,
  Acontecimiento,
} from '../../../interfaces/acontecimiento';
import { errorUsuario } from '../../../servicios/auth.service';
import { I18nService } from '../../../servicios/i18n.service';
import { NotificacionesService } from '../../../servicios/notificaciones.service';
import { AcontecimientosService } from '../../../servicios/acontecimientos.service';
import { mensajeErrorComun } from '../../../utiles/errores';
import { esFechaIso, formatearFechaLarga } from '../../../utiles/fechas';
import { IconoComponent } from '../icono/icono.component';
import { PopupComponent } from '../popup/popup.component';

export type ModoAcontecimiento = 'crear' | 'ver' | 'modificar' | 'eliminar';

/**
 * Popups de un acontecimiento destacado: crear, ver, modificar y eliminar. Lo usan
 * tanto la lista de acontecimientos como la fecha VAU. Desde «ver» se puede pasar a
 * modificar o eliminar sin cerrar.
 */
@Component({
  selector: 'app-acontecimiento-popup',
  standalone: true,
  imports: [ReactiveFormsModule, IconoComponent, PopupComponent],
  templateUrl: './acontecimiento-popup.component.html',
  styleUrl: './acontecimiento-popup.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AcontecimientoPopupComponent implements OnInit {
  readonly modoInicial = input.required<ModoAcontecimiento>({ alias: 'modo' });
  /** Acontecimiento sobre el que se actúa; `null` al crear. */
  readonly acontecimiento = input<Acontecimiento | null>(null);
  /** Fecha con la que se rellena el formulario al crear (editable). */
  readonly fechaInicial = input<string | null>(null);
  /** Muestra «Ir a esta fecha» en el modo ver. */
  readonly mostrarIrAFecha = input(false);

  readonly guardado = output<Acontecimiento>();
  readonly eliminado = output<Acontecimiento>();
  readonly irAFecha = output<string>();
  readonly cerrar = output<void>();

  private readonly acontecimientos = inject(AcontecimientosService);
  private readonly avisos = inject(NotificacionesService);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly i18n = inject(I18nService);

  protected readonly t = this.i18n.t;
  protected readonly fechaMin = FECHA_ACONTECIMIENTO_MIN;
  protected readonly fechaMax = FECHA_ACONTECIMIENTO_MAX;
  protected readonly descripcionMax = DESCRIPCION_ACONTECIMIENTO_MAX;

  protected readonly modo = signal<ModoAcontecimiento>('crear');
  protected readonly enviando = signal(false);
  protected readonly errorGeneral = signal<string | null>(null);

  protected readonly formulario = this.fb.group({
    fecha: ['', [Validators.required, fechaAcontecimientoValidator]],
    descripcion: ['', [Validators.required, Validators.maxLength(DESCRIPCION_ACONTECIMIENTO_MAX), noVacio]],
  });

  private readonly descripcionActual = toSignal(this.formulario.controls.descripcion.valueChanges, {
    initialValue: '',
  });
  protected readonly caracteres = computed(() => this.descripcionActual().length);

  protected readonly titulo = computed(() => {
    switch (this.modo()) {
      case 'crear':
        return this.t('acontecimientos.tituloCrear');
      case 'modificar':
        return this.t('acontecimientos.tituloModificar');
      case 'eliminar':
        return this.t('acontecimientos.tituloEliminar');
      default:
        return this.t('acontecimientos.tituloVer');
    }
  });

  ngOnInit(): void {
    this.cambiarModo(this.modoInicial());
  }

  protected fechaLarga(iso: string): string {
    return formatearFechaLarga(iso.slice(0, 10), this.i18n.locale());
  }

  protected cambiarModo(modo: ModoAcontecimiento): void {
    this.errorGeneral.set(null);
    this.modo.set(modo);

    const acontecimiento = this.acontecimiento();
    if (modo === 'crear') {
      this.formulario.reset({ fecha: this.fechaInicial() ?? '', descripcion: '' });
    } else if (modo === 'modificar' && acontecimiento) {
      this.formulario.reset({ fecha: acontecimiento.fecha, descripcion: acontecimiento.descripcion });
    }
  }

  protected guardar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const datos = this.formulario.getRawValue();
    const cuerpo = { fecha: datos.fecha, descripcion: datos.descripcion.trim() };
    const acontecimiento = this.acontecimiento();
    const creando = this.modo() === 'crear' || !acontecimiento;

    this.enviar(
      creando ? this.acontecimientos.crear(cuerpo) : this.acontecimientos.modificar(acontecimiento.id, cuerpo),
      (guardado) => {
        this.avisos.exito(this.t(creando ? 'acontecimientos.creado' : 'acontecimientos.modificado'));
        this.guardado.emit(guardado);
      },
    );
  }

  protected eliminar(): void {
    const acontecimiento = this.acontecimiento();
    if (!acontecimiento) {
      return;
    }

    this.enviar(this.acontecimientos.eliminar(acontecimiento.id), () => {
      this.avisos.exito(this.t('acontecimientos.eliminado'));
      this.eliminado.emit(acontecimiento);
    });
  }

  protected invalido(campo: 'fecha' | 'descripcion'): boolean {
    const control = this.formulario.controls[campo];
    return control.invalid && (control.touched || control.dirty);
  }

  protected errorCampo(campo: 'fecha' | 'descripcion'): string {
    const control = this.formulario.controls[campo];
    if (control.hasError('required') || control.hasError('vacio')) {
      return this.t('comun.obligatorio');
    }
    if (control.hasError('duplicado')) {
      return this.t('acontecimientos.duplicado');
    }
    if (control.hasError('maxlength')) {
      return this.t('comun.campoMaximo', { max: DESCRIPCION_ACONTECIMIENTO_MAX });
    }
    return this.t('acontecimientos.fechaFueraDeRango');
  }

  private enviar<T>(peticion: Observable<T>, alTerminar: (respuesta: T) => void): void {
    if (this.enviando()) {
      return;
    }
    this.errorGeneral.set(null);
    this.enviando.set(true);
    peticion.pipe(finalize(() => this.enviando.set(false))).subscribe({
      next: alTerminar,
      error: (e: unknown) => this.mostrarError(e),
    });
  }

  private mostrarError(e: unknown): void {
    const error = errorUsuario(e);
    switch (error?.codigo) {
      case 'SESION_NO_VALIDA':
        // El interceptor ya ha cerrado la sesión y vuelto al login.
        this.cerrar.emit();
        return;
      case 'ACONTECIMIENTO_DUPLICADO':
        this.marcarFecha({ duplicado: true });
        return;
      case 'FECHA_FUERA_DE_RANGO':
        this.marcarFecha({ fueraDeRango: true });
        return;
      case 'ACONTECIMIENTO_NO_ENCONTRADO':
        this.errorGeneral.set(this.t('acontecimientos.noEncontrado'));
        return;
      default:
        this.errorGeneral.set(mensajeErrorComun(error, this.t));
    }
  }

  private marcarFecha(error: Record<string, boolean>): void {
    const fecha = this.formulario.controls.fecha;
    fecha.setErrors(error);
    fecha.markAsTouched();
  }
}

function fechaAcontecimientoValidator(control: { value: string }): Record<string, boolean> | null {
  const valor = control.value;
  if (!valor) {
    return null;
  }
  return esFechaIso(valor) && valor >= FECHA_ACONTECIMIENTO_MIN && valor <= FECHA_ACONTECIMIENTO_MAX
    ? null
    : { fueraDeRango: true };
}

function noVacio(control: { value: string }): Record<string, boolean> | null {
  return control.value && !control.value.trim() ? { vacio: true } : null;
}
