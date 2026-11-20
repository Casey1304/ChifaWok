import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import {
  Usuario,
  LoginRequest,
  RegistroRequest,
  RolUsuario,
  DEMO_CREDENCIALES,
  PASSWORD_MIN_LENGTH
} from '../models/auth.model';

/** Contraseñas aceptadas para la cuenta administradora de demostración. */
const ADMIN_PASSWORDS = [DEMO_CREDENCIALES.ADMIN.password, 'admin123'];

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'current_user';
  /** Clave usada en sessionStorage cuando el usuario no marca «Recordarme». */
  private readonly SESSION_KEY = 'chifawok_current_user';

  readonly currentUser = signal<Usuario | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.rol === 'ADMIN');
  readonly isCliente = computed(() => this.currentUser()?.rol === 'CLIENTE');

  constructor(
    private storage: StorageService,
    private router: Router
  ) {
    this.restaurarSesion();
  }

  login(credentials: LoginRequest): { success: boolean; message: string; user?: Usuario } {
    const email = (credentials.email || '').trim().toLowerCase();
    const password = credentials.password || '';
    const recordar = credentials.recordar !== false;

    // Cuenta demo: Chef / Administrador
    if (email === DEMO_CREDENCIALES.ADMIN.email) {
      if (!ADMIN_PASSWORDS.includes(password)) {
        return { success: false, message: 'Contraseña incorrecta para el usuario administrador' };
      }
      const user: Usuario = {
        id: 1,
        nombre: 'Carlos',
        apellido: 'Wong (Chef & Admin)',
        email: DEMO_CREDENCIALES.ADMIN.email,
        rol: 'ADMIN',
        token: 'mock-jwt-admin-token-' + Date.now()
      };
      this.setUserSession(user, recordar);
      return { success: true, message: 'Inicio de sesión como Administrador exitoso', user };
    }

    // Cuenta demo: Comensal VIP
    if (email === DEMO_CREDENCIALES.CLIENTE.email) {
      if (password !== DEMO_CREDENCIALES.CLIENTE.password) {
        return { success: false, message: 'Contraseña incorrecta para el comensal de demostración' };
      }
      const user: Usuario = {
        id: 2,
        nombre: 'Carlos',
        apellido: 'Mendoza',
        email: DEMO_CREDENCIALES.CLIENTE.email,
        telefono: '+51 987 654 321',
        direccion: 'Av. Pardo 450, Dpto 602, Miraflores',
        rol: 'CLIENTE',
        token: 'mock-jwt-cliente-token-' + Date.now()
      };
      this.setUserSession(user, recordar);
      return { success: true, message: '¡Bienvenido de nuevo, Carlos!', user };
    }

    // Usuarios registrados desde /registro (persistidos en LocalStorage).
    // Nota: sin backend no existe verificación real de contraseña para estas cuentas.
    const usuarios = this.storage.get<Usuario[]>('usuarios', []);
    const found = usuarios.find(u => u.email.toLowerCase() === email && u.rol === 'CLIENTE');
    if (found && password.length >= PASSWORD_MIN_LENGTH) {
      this.setUserSession(found, recordar);
      return { success: true, message: `Bienvenido, ${found.nombre}`, user: found };
    }

    return { success: false, message: 'Credenciales inválidas. Usa los accesos rápidos de demostración o regístrate.' };
  }

  registro(req: RegistroRequest): { success: boolean; message: string; user?: Usuario } {
    const usuarios = this.storage.get<Usuario[]>('usuarios', []);
    if (usuarios.some(u => u.email.toLowerCase() === req.email.trim().toLowerCase())) {
      return { success: false, message: 'El correo electrónico ya se encuentra registrado.' };
    }

    const newUser: Usuario = {
      id: Date.now(),
      nombre: req.nombre,
      apellido: req.apellido,
      email: req.email.trim(),
      telefono: req.telefono,
      direccion: `${req.direccion}, ${req.distrito}`,
      rol: 'CLIENTE',
      token: 'mock-jwt-cliente-' + Date.now()
    };

    usuarios.push(newUser);
    this.storage.set('usuarios', usuarios);
    this.setUserSession(newUser, true);

    return { success: true, message: 'Cuenta creada exitosamente. ¡Bienvenido a Chifa Wok!', user: newUser };
  }

  logout(): void {
    this.limpiarSesion();
    this.router.navigate(['/login']);
  }

  // Quick switch between Admin and Client for testing convenience
  quickSwitchRole(role: RolUsuario): void {
    const res = this.login({ ...DEMO_CREDENCIALES[role], recordar: true });
    if (!res.success) return;
    this.router.navigate([role === 'ADMIN' ? '/admin/pedidos' : '/carta']);
  }

  private setUserSession(user: Usuario, recordar: boolean): void {
    // Una sola sesión activa: se descarta cualquier sesión previa en ambos almacenes.
    this.limpiarSesion();
    this.currentUser.set(user);
    if (recordar) {
      this.storage.set(this.USER_KEY, user);
    } else {
      try {
        sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
      } catch {
        // sessionStorage no disponible: la sesión solo vive en memoria.
      }
    }
  }

  private limpiarSesion(): void {
    this.currentUser.set(null);
    this.storage.remove(this.USER_KEY);
    try {
      sessionStorage.removeItem(this.SESSION_KEY);
    } catch {
      // sessionStorage no disponible: nada que limpiar.
    }
  }

  private restaurarSesion(): void {
    let saved = this.storage.get<Usuario | null>(this.USER_KEY, null);
    if (!saved) {
      try {
        const raw = sessionStorage.getItem(this.SESSION_KEY);
        saved = raw ? (JSON.parse(raw) as Usuario) : null;
      } catch {
        saved = null;
      }
    }

    if (this.esUsuarioValido(saved)) {
      this.currentUser.set(saved);
    } else if (saved) {
      // Sesión corrupta o con formato desconocido: se invalida.
      this.limpiarSesion();
    }
  }

  private esUsuarioValido(u: Usuario | null): u is Usuario {
    return !!u &&
      typeof u.email === 'string' &&
      typeof u.token === 'string' &&
      (u.rol === 'ADMIN' || u.rol === 'CLIENTE');
  }
}
