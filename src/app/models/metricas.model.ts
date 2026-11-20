export interface MetricasDashboard {
  ventas_del_dia: number;
  pedidos_totales: number;
  pedidos_por_voz: number;
  pedidos_por_web: number;
  tiempo_promedio_wok_minutos: number;
  eficiencia_voice_ai_porcentaje: number;
  precision_fonetica_wok: number;
  tiempo_promedio_orden_segundos: number;
  upselling_exitoso_porcentaje: number;
  llamadas_simultaneas_activas: number;
  llamadas_hoy: number;
  platos_mas_pedidos_voz: {
    nombre: string;
    porcentaje: number;
    pedidos: number;
  }[];
  jerga_chifa_frecuente: {
    termino: string;
    significado: string;
    frecuencia: number;
  }[];
  efectividad_recomendaciones: {
    producto: string;
    sugerencias: number;
    aceptadas: number;
    porcentaje: number;
    ingreso_adicional: number;
  }[];
}
