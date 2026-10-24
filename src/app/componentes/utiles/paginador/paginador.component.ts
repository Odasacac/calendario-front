import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { I18nService } from '../../../servicios/i18n.service';
import { IconoComponent } from '../icono/icono.component';

/** Hueco «…» entre números de página. */
const HUECO = null;

/**
 * Paginador reutilizable. `pagina` empieza en 0 (como el back); en pantalla se
 * muestra desde 1. Muestra siempre la primera y la última página y las vecinas
 * de la actual, con «…» entre medias.
 */
@Component({
  selector: 'app-paginador',
  standalone: true,
  imports: [IconoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './paginador.component.html',
  styleUrl: './paginador.component.css',
})
export class PaginadorComponent {
  readonly pagina = input.required<number>();
  readonly totalPaginas = input.required<number>();
  readonly totalElementos = input.required<number>();
  readonly tamanyo = input.required<number>();
  readonly tamanyos = input<readonly number[]>([5, 10, 20, 50]);
  readonly deshabilitado = input(false);

  readonly paginaChange = output<number>();
  readonly tamanyoChange = output<number>();

  protected readonly t = inject(I18nService).t;

  protected readonly desde = computed(() =>
    this.totalElementos() === 0 ? 0 : this.pagina() * this.tamanyo() + 1,
  );
  protected readonly hasta = computed(() =>
    Math.min((this.pagina() + 1) * this.tamanyo(), this.totalElementos()),
  );
  protected readonly esPrimera = computed(() => this.pagina() <= 0);
  protected readonly esUltima = computed(() => this.pagina() >= this.totalPaginas() - 1);

  /** Números de página (desde 0) con `null` donde va «…». */
  protected readonly numeros = computed<ReadonlyArray<number | null>>(() => {
    const total = this.totalPaginas();
    const actual = this.pagina();
    const visibles = new Set([0, total - 1, actual - 1, actual, actual + 1].filter((n) => n >= 0 && n < total));
    const ordenados = [...visibles].sort((a, b) => a - b);

    const resultado: Array<number | null> = [];
    ordenados.forEach((n, i) => {
      const anterior = ordenados[i - 1];
      if (i > 0 && n - anterior === 2) {
        resultado.push(anterior + 1);
      } else if (i > 0 && n - anterior > 2) {
        resultado.push(HUECO);
      }
      resultado.push(n);
    });
    return resultado;
  });

  protected irA(pagina: number): void {
    if (!this.deshabilitado() && pagina !== this.pagina() && pagina >= 0 && pagina < this.totalPaginas()) {
      this.paginaChange.emit(pagina);
    }
  }

  protected cambiarTamanyo(evento: Event): void {
    this.tamanyoChange.emit(Number((evento.target as HTMLSelectElement).value));
  }
}
