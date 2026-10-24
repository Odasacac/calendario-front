import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PaginadorComponent } from './paginador.component';

describe('PaginadorComponent', () => {
  let fixture: ComponentFixture<PaginadorComponent>;
  let elemento: HTMLElement;

  function crear(pagina: number, totalElementos: number, tamanyo = 10, deshabilitado = false): void {
    fixture = TestBed.createComponent(PaginadorComponent);
    elemento = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('pagina', pagina);
    fixture.componentRef.setInput('totalElementos', totalElementos);
    fixture.componentRef.setInput('tamanyo', tamanyo);
    fixture.componentRef.setInput('totalPaginas', Math.ceil(totalElementos / tamanyo));
    fixture.componentRef.setInput('deshabilitado', deshabilitado);
    fixture.detectChanges();
  }

  /** Números visibles, con «…» para los huecos. */
  function numeros(): string[] {
    return Array.from(elemento.querySelectorAll('.numeros li')).map((li) => li.textContent!.trim());
  }

  function boton(etiqueta: string): HTMLButtonElement {
    return elemento.querySelector<HTMLButtonElement>(`[aria-label="${etiqueta}"]`)!;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PaginadorComponent] }).compileComponents();
  });

  it('muestra el rango de elementos visibles', () => {
    crear(2, 47);
    expect(elemento.querySelector('.rango')!.textContent).toContain('21–30 de 47');
    crear(4, 47);
    expect(elemento.querySelector('.rango')!.textContent).toContain('41–47 de 47');
  });

  it('con una sola página no muestra los botones', () => {
    crear(0, 7);
    expect(elemento.querySelector('.paginas')).toBeNull();
    expect(elemento.querySelector('.rango')!.textContent).toContain('1–7 de 7');
  });

  it('muestra la primera, la última y las vecinas de la actual con «…»', () => {
    crear(5, 200);
    expect(numeros()).toEqual(['1', '…', '5', '6', '7', '…', '20']);
    expect(boton('Página 6').getAttribute('aria-current')).toBe('page');
  });

  it('no pone «…» para saltar una sola página', () => {
    crear(2, 50);
    expect(numeros()).toEqual(['1', '2', '3', '4', '5']);
  });

  it('emite la página elegida', () => {
    crear(5, 200);
    const emitidas: number[] = [];
    fixture.componentInstance.paginaChange.subscribe((p) => emitidas.push(p));

    boton('Página 7').click();
    boton('Página siguiente').click();
    boton('Página anterior').click();
    boton('Primera página').click();
    boton('Última página').click();
    boton('Página 6').click(); // la actual: no emite

    expect(emitidas).toEqual([6, 6, 4, 0, 19]);
  });

  it('desactiva los extremos en la primera y la última página', () => {
    crear(0, 30);
    expect(boton('Primera página').disabled).toBeTrue();
    expect(boton('Página anterior').disabled).toBeTrue();
    expect(boton('Página siguiente').disabled).toBeFalse();

    crear(2, 30);
    expect(boton('Página siguiente').disabled).toBeTrue();
    expect(boton('Última página').disabled).toBeTrue();
  });

  it('deshabilitado no deja cambiar de página ni de tamaño', () => {
    crear(1, 30, 10, true);
    expect(boton('Página siguiente').disabled).toBeTrue();
    expect(elemento.querySelector<HTMLSelectElement>('.select-tamanyo')!.disabled).toBeTrue();
  });

  it('emite el tamaño elegido', () => {
    crear(0, 30);
    let tamanyo = 0;
    fixture.componentInstance.tamanyoChange.subscribe((t) => (tamanyo = t));

    const select = elemento.querySelector<HTMLSelectElement>('.select-tamanyo')!;
    expect(Array.from(select.options).map((o) => o.value)).toEqual(['5', '10', '20', '50']);
    expect(select.value).toBe('10');
    select.value = '50';
    select.dispatchEvent(new Event('change'));
    expect(tamanyo).toBe(50);
  });
});
