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
