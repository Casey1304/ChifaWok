import { Injectable, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { Usuario, LoginRequest, RegistroRequest, RolUsuario } from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_KEY = 'current_user';
  
  readonly currentUser = signal<Usuario | null>(null);
  readonly isAuthenticated = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() => this.currentUser()?.rol === 'ADMIN');
  readonly isCliente = computed(() => this.currentUser()?.rol === 'CLIENTE');

  constructor(
    private storage: StorageService,
    private router: Router
  ) {
    const savedUser = this.storage.get<Usuario | null>(this.USER_KEY, null);
    if (savedUser) {
      this.currentUser.set(savedUser);
    }
  }

  login(credentials: LoginRequest): { success: boolean; message: string; user?: Usuario } {
    const email = credentials.email.trim().toLowerCase();
    const password = credentials.password;

    // Check pre-configured demo users
    if (email === 'gerencia@chifawok.pe') {
      if (password === 'ChifaSabor2025' || password === 'admin123' || password === 'admin') {
        const user: Usuario = {
          id: 1,
          nombre: 'Carlos',
          apellido: 'Wong (Chef & Admin)',
          email: 'gerencia@chifawok.pe',
          rol: 'ADMIN',
          token: 'mock-jwt-admin-token-' + Date.now()
        };
        this.setUserSession(user);
        return { success: true, message: 'Inicio de sesión como Administrador exitoso', user };
      } else {
        return { success: false, message: 'Contraseña incorrecta para el usuario administrador' };
      }
    }

    if (email === 'carlos.mendoza@email.pe') {
      const user: Usuario = {
        id: 2,
        nombre: 'Carlos',
        apellido: 'Mendoza',
        email: 'carlos.mendoza@email.pe',
        telefono: '+51 987 654 321',
        direccion: 'Av. Pardo 450, Dpto 602, Miraflores',
        rol: 'CLIENTE',
        token: 'mock-jwt-cliente-token-' + Date.now()
      };
      this.setUserSession(user);
      return { success: true, message: '¡Bienvenido de nuevo, Carlos!', user };
    }

    // Generic registered user lookup or fallback in demo mode
    const usuarios = this.storage.get<Usuario[]>('usuarios', []);
    const found = usuarios.find(u => u.email.toLowerCase() === email);
    if (found) {
      this.setUserSession(found);
      return { success: true, message: `Bienvenido, ${found.nombre}`, user: found };
    }

    // Allow quick demo login for testing with any valid email
    if (email.includes('@') && password.length >= 4) {
      const isChef = email.includes('admin') || email.includes('gerencia');
      const newUser: Usuario = {
        id: Date.now(),
        nombre: email.split('@')[0],
        apellido: 'Comensal',
        email: email,
        rol: isChef ? 'ADMIN' : 'CLIENTE',
        token: 'mock-jwt-token-' + Date.now()
      };
      this.setUserSession(newUser);
      return { success: true, message: 'Sesión iniciada en modo demostración', user: newUser };
    }

    return { success: false, message: 'Credenciales inválidas. Usa los accesos rápidos de demostración.' };
  }

  registro(req: RegistroRequest): { success: boolean; message: string; user?: Usuario } {
    const usuarios = this.storage.get<Usuario[]>('usuarios', []);
    if (usuarios.some(u => u.email.toLowerCase() === req.email.toLowerCase())) {
      return { success: false, message: 'El correo electrónico ya se encuentra registrado.' };
    }

    const newUser: Usuario = {
      id: Date.now(),
      nombre: req.nombre,
      apellido: req.apellido,
      email: req.email,
      telefono: req.telefono,
      direccion: `${req.direccion}, ${req.distrito}`,
      rol: 'CLIENTE',
      token: 'mock-jwt-cliente-' + Date.now()
    };

    usuarios.push(newUser);
    this.storage.set('usuarios', usuarios);
    this.setUserSession(newUser);

    return { success: true, message: 'Cuenta creada exitosamente. ¡Bienvenido a Chifa Wok!', user: newUser };
  }

  logout(): void {
    this.currentUser.set(null);
    this.storage.remove(this.USER_KEY);
    this.router.navigate(['/login']);
  }

  // Quick switch between Admin and Client for testing convenience
  quickSwitchRole(role: RolUsuario): void {
    if (role === 'ADMIN') {
      this.login({ email: 'gerencia@chifawok.pe', password: 'ChifaSabor2025' });
      this.router.navigate(['/admin/pedidos']);
    } else {
      this.login({ email: 'carlos.mendoza@email.pe', password: '123' });
      this.router.navigate(['/carta']);
    }
  }

  private setUserSession(user: Usuario): void {
    this.currentUser.set(user);
    this.storage.set(this.USER_KEY, user);
  }
}
