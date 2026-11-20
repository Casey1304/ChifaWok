export interface TranscripcionMensaje {
  id: string;
  remitente: 'usuario' | 'mei';
  texto: string;
  timestamp: string;
}

export interface SesionVoz {
  id_sesion: number;
  codigo_llamada: string;
  id_cliente?: number;
  cliente_nombre: string;
  ubicacion: string;
  canal: string;
  fecha: string;
  hora: string;
  hace_tiempo: string;
  duracion_segundos: number;
  exitosa: boolean;
  confianza: number;
  transcripcion_usuario: string;
  respuesta_mei: string;
  platos_identificados: string[];
  modificadores_jerga?: string[];
  pedido_asociado_codigo?: string;
  estado: 'finalizada' | 'en_curso' | 'aclarando';
}
