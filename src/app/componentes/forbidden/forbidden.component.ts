import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { I18nService } from '../../servicios/i18n.service';
import { IconoComponent } from '../utiles/icono/icono.component';

@Component({
  selector: 'app-forbidden',
  standalone: true,
  imports: [IconoComponent],
  templateUrl: './forbidden.component.html',
  styleUrl: './forbidden.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForbiddenComponent {
  private readonly router = inject(Router);
  protected readonly t = inject(I18nService).t;

  protected volverAlLogin(): void {
    void this.router.navigate(['/login']);
  }
}
