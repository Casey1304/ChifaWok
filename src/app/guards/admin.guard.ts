import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const notification = inject(NotificationService);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  notification.warning(
    'Acceso Administrativo Requerido',
    'Debes iniciar sesión con credenciales de administrador para ingresar al panel.'
  );
  // Se devuelve un UrlTree para que el router cancele y redirija en una sola navegación.
  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
