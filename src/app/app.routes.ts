import { Routes } from '@angular/router';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'carta',
    loadComponent: () => import('./pages/carta/carta.component').then(m => m.CartaComponent)
  },
  {
    path: 'mis-pedidos',
    loadComponent: () => import('./pages/mis-pedidos/mis-pedidos.component').then(m => m.MisPedidosComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'registro',
    loadComponent: () => import('./pages/registro/registro.component').then(m => m.RegistroComponent)
  },
  // Admin Routes (Protected with AdminGuard)
  {
    path: 'admin/pedidos',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin-pedidos/admin-pedidos.component').then(m => m.AdminPedidosComponent)
  },
  {
    path: 'admin/productos',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin-productos/admin-productos.component').then(m => m.AdminProductosComponent)
  },
  {
    path: 'admin/clientes',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin-clientes/admin-clientes.component').then(m => m.AdminClientesComponent)
  },
  {
    path: 'admin/metricas',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin-metricas/admin-metricas.component').then(m => m.AdminMetricasComponent)
  },
  {
    path: 'admin/configuracion',
    canActivate: [adminGuard],
    loadComponent: () => import('./pages/admin-configuracion/admin-configuracion.component').then(m => m.AdminConfiguracionComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
