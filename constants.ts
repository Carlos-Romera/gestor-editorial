// INSTRUCCIONES DE CONEXIÓN A BASE DE DATOS:
// 1. Despliega el código de 'backend/GoogleAppsScript.js' como Aplicación Web en Google.
// 2. Asegúrate de configurar el acceso como: "Cualquier persona" (Anyone).
// 3. Pega la URL que te da Google (termina en /exec) dentro de las comillas abajo.

export const GOOGLE_SCRIPT_URL: string = "https://script.google.com/macros/s/AKfycbwhD_fiViUDZzjcmBYdF-P8ffI6vizS3btU8IsyRk8nJOKRD1I2laW7iOFag0vThAMD/exec"; 

// EJEMPLO: export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzW84eqimpk-7dA3kNaWcvO6jEBIkcx-EEiPjPRjCn7zB5JhxGuNSJFFriA_lTSVSA/exec";

// Si la URL está vacía, usaremos datos de prueba locales para que veas la UI funcionar.
export const IS_DEMO_MODE = GOOGLE_SCRIPT_URL === "";

export const DEFAULT_DEADLINE_DAYS = 3;