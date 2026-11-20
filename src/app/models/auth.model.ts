export type RolUsuario = 'ADMIN' | 'CLIENTE';

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string;
  direccion?: string;
  rol: RolUsuario;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  recordar?: boolean;
}

export interface RegistroRequest {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  distrito: string;
  password: string;
}

/** Longitud mínima de contraseña exigida por los formularios de login y registro. */
export const PASSWORD_MIN_LENGTH = 4;

/**
 * Credenciales de las cuentas de demostración.
 * Deben cumplir PASSWORD_MIN_LENGTH; si no, el formulario queda inválido y
 * el botón «Iniciar Sesión» se deshabilita (causa del fallo de reingreso del Comensal VIP).
 */
export const DEMO_CREDENCIALES: Readonly<Record<RolUsuario, Readonly<LoginRequest>>> = {
  ADMIN: { email: 'gerencia@chifawok.pe', password: 'ChifaSabor2025' },
  CLIENTE: { email: 'carlos.mendoza@email.pe', password: 'Comensal2025' }
};
