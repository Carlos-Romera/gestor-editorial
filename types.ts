
export enum EstadoProyecto {
  ACTIVO = 'Activo',
  COMPLETADO = 'Completado',
  PAUSADO = 'Pausado'
}

export enum EstadoRonda {
  PENDIENTE = 'Pendiente',
  EN_PROCESO = 'En Proceso',
  ENTREGADA = 'Entregada'
}

export enum TipoRonda {
  PRIMERAS = 'Primeras',
  SEGUNDAS = 'Segundas',
  TERCERAS = 'Terceras',
  FINALES = 'Finales'
}

export enum CategoriaRonda {
  MAYOR = 'Mayor',
  MENOR = 'Menor'
}

export interface Proyecto {
  ID_PROYECTO: string;
  NOMBRE_PROYECTO: string;
  CLIENTE: string;
  CAMPANA: string;
  ESTADO: string;
}

export interface Unidad {
  ID_UNIDAD: string;
  ID_PROYECTO: string;
  CODIGO_UD: string;
  TITULO_UD: string;
  FECHA_RECEPCION_ORIGINALES: string;
  FECHA_LIMITE_PRIMERAS: string;
  NOTAS: string;
}

export interface Ronda {
  ID_RONDA: string;
  ID_UNIDAD: string;
  TIPO_RONDA: string;
  FECHA_RECEP: string;
  FECHA_LIMITE: string;
  ESTADO: string;
  ENLACE_ARCH: string;
  COMENTARIOS: string;
  CATEGORIA: string; // Estandarizado sin acento
}

export interface AppData {
  proyectos: Proyecto[];
  unidades: Unidad[];
  rondas: Ronda[];
  spreadsheetUrl?: string;
  spreadsheetName?: string;
  spreadsheetId?: string;
  lastUpdated?: string;
}

export interface ApiConfig {
  apiUrl: string;
}
