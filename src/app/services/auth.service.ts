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
import { generarSal, hashPassword, verificarPassword } from '../utils/hash.util';

interface CredencialLocal {
  sal: string;
  hash: string;
}

/** Contraseñas aceptadas para la cuenta administradora de demostración. */
const ADMIN_PASSWORDS = [DEMO_CREDENCIALES.ADMIN.password, 'admin123'];

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'current_user';
  /** Clave usada en sessionStorage cuando el usuario no marca «Recordarme». */
  private readonly SESSION_KEY = 'chifawok_current_user';
  /** Hash y sal de las contraseñas de cuentas registradas (por correo). */
  private readonly CREDENCIALES_KEY = 'credenciales';

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

  async login(credentials: LoginRequest): Promise<{ success: boolean; message: string; user?: Usuario }> {
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

    // Usuarios registrados desde /registro: se verifica el hash SHA-256 con sal guardado al registrarse.
    // Protección demostrativa: los datos viven en LocalStorage del navegador, no en un servidor.
    const usuarios = this.storage.get<Usuario[]>('usuarios', []);
    const found = usuarios.find(u => u.email.toLowerCase() === email && u.rol === 'CLIENTE');
    const credencial = this.storage.get<Record<string, CredencialLocal>>(this.CREDENCIALES_KEY, {})[email];
    if (found && credencial && password.length >= PASSWORD_MIN_LENGTH &&
        await verificarPassword(password, credencial.sal, credencial.hash)) {
      this.setUserSession(found, recordar);
      return { success: true, message: `Bienvenido, ${found.nombre}`, user: found };
    }

    return { success: false, message: 'Credenciales inválidas. Usa los accesos rápidos de demostración o regístrate.' };
  }

  async registro(req: RegistroRequest): Promise<{ success: boolean; message: string; user?: Usuario }> {
    const email = req.email.trim().toLowerCase();
    const usuarios = this.storage.get<Usuario[]>('usuarios', []);
    const reservado = email === DEMO_CREDENCIALES.ADMIN.email || email === DEMO_CREDENCIALES.CLIENTE.email;
    if (reservado || usuarios.some(u => u.email.toLowerCase() === email)) {
      return { success: false, message: 'El correo electrónico ya se encuentra registrado.' };
    }
    if ((req.password || '').length < PASSWORD_MIN_LENGTH) {
      return { success: false, message: `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.` };
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

    // Solo se guarda el hash con sal; la contraseña nunca se almacena en texto plano.
    const sal = generarSal();
    const credenciales = this.storage.get<Record<string, CredencialLocal>>(this.CREDENCIALES_KEY, {});
    credenciales[email] = { sal, hash: await hashPassword(req.password, sal) };

    usuarios.push(newUser);
    this.storage.set('usuarios', usuarios);
    this.storage.set(this.CREDENCIALES_KEY, credenciales);
    this.setUserSession(newUser, true);

    return { success: true, message: 'Cuenta creada exitosamente. ¡Bienvenido a Chifa Wok!', user: newUser };
  }

  logout(): void {
    this.limpiarSesion();
    this.router.navigate(['/login']);
  }

  // Quick switch between Admin and Client for testing convenience
  async quickSwitchRole(role: RolUsuario): Promise<void> {
    const res = await this.login({ ...DEMO_CREDENCIALES[role], recordar: true });
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

  /**
   * Valida la sesión guardada: el rol ADMIN solo corresponde a la cuenta administradora
   * y un comensal debe ser la cuenta demo o un usuario registrado. Así, editar el rol
   * en el almacenamiento del navegador no concede acceso al panel.
   */
  private esUsuarioValido(u: Usuario | null): u is Usuario {
    if (!u || typeof u.email !== 'string' || typeof u.token !== 'string') return false;
    const email = u.email.toLowerCase();
    if (u.rol === 'ADMIN') return email === DEMO_CREDENCIALES.ADMIN.email;
    if (u.rol !== 'CLIENTE') return false;
    if (email === DEMO_CREDENCIALES.ADMIN.email) return false;
    if (email === DEMO_CREDENCIALES.CLIENTE.email) return true;
    return this.storage.get<Usuario[]>('usuarios', []).some(r => r.email.toLowerCase() === email && r.rol === 'CLIENTE');
  }
}
