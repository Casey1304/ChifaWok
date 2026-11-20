export interface Cliente {
  id_cliente: number;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  direccion: string;
  distrito: string;
  nivel: 'Oro VIP' | 'Frecuente' | 'Nuevo';
  pedidos_totales: number;
  gasto_total: number;
  canal_habitual: 'Voice AI' | 'Web' | 'App';
  plato_favorito: string;
  ultimo_pedido: string;
  puntos_dragon: number;
  perfil_voz?: {
    acento_detectado: string;
    preferencias_culinarias: string;
    horario_habitual: string;
  };
}
