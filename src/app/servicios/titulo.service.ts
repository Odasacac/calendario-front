import { Injectable, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { ClaveTraduccion } from '../i18n/idiomas';
import { I18nService } from './i18n.service';

/**
 * El `title` de cada ruta es una clave de traducción, no un texto: así el
 * título de la pestaña también cambia al cambiar de idioma.
 */
@Injectable({ providedIn: 'root' })
export class TituloTraducidoStrategy extends TitleStrategy {
  private readonly titulo = inject(Title);
  private readonly i18n = inject(I18nService);
  private readonly clave = signal<ClaveTraduccion | null>(null);

  constructor() {
    super();

    effect(() => {
      const clave = this.clave();
      const nombre = this.i18n.t('app.nombre');
      this.titulo.setTitle(clave ? `${nombre} · ${this.i18n.t(clave)}` : nombre);
    });
  }

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const clave = this.buildTitle(snapshot);
    this.clave.set((clave as ClaveTraduccion | undefined) ?? null);
  }
}
