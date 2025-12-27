
/**
 * ==========================================================================
 * BACKEND GESTOR EDITORIAL - VERSIÓN ULTRA-ESTABLE 3.4
 * ==========================================================================
 */

const SPREADSHEET_ID = '1vx-gep3Qf6AIHqo-lNQfd14FBaHB0CjazME3P7cDL8g'; 

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  // Respuesta rápida para el editor de Google Apps Script
  if (!e || !e.parameter) {
    return responseJSON({ 
      status: 'ok', 
      message: 'Script Activo v3.4. Motor de base de datos listo.' 
    });
  }

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Procesar acciones de escritura (POST)
    if (e.postData && e.postData.contents) {
      const payload = JSON.parse(e.postData.contents);
      if (payload.action === 'save') return saveData(ss, payload.type, payload.data);
      if (payload.action === 'delete') return deleteData(ss, payload.type, payload.id);
    }

    // Procesar lectura (GET)
    const data = {
      proyectos: getSheetData(ss, 'Proyectos'),
      unidades: getSheetData(ss, 'Unidades'),
      rondas: getSheetData(ss, 'Rondas'),
      spreadsheetName: ss.getName(),
      lastPulse: new Date().toISOString()
    };

    return responseJSON({ status: 'success', data: data });

  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  }
}

function getSheetData(ss, name) {
  const sheet = ss.getSheetByName(name);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      if (!h) return;
      // Normalizamos la cabecera: sin acentos y en MAYÚSCULAS para el JSON de la App
      const cleanKey = String(h).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      obj[cleanKey] = row[i];
      // Mantenemos la original también por compatibilidad
      obj[h] = row[i];
    });
    return obj;
  });
}

function saveData(ss, type, data) {
  const sheetName = type === 'proyecto' ? 'Proyectos' : type === 'unidad' ? 'Unidades' : 'Rondas';
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) return responseJSON({ status: 'error', message: 'Hoja no encontrada: ' + sheetName });
  
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  
  // Determinamos el ID para buscar si es una actualización
  const primaryKey = headers[0];
  const idValue = String(data[primaryKey] || data['ID_PROYECTO'] || data['ID_UNIDAD'] || data['ID_RONDA'] || "");
  
  let rowIndex = -1;
  if (idValue) {
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === idValue) {
        rowIndex = i + 1;
        break;
      }
    }
  }

  // Preparamos la fila mapeando cada cabecera del Excel con el JSON recibido
  const rowData = headers.map(h => {
    if (!h) return "";
    const cleanHeader = String(h).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    
    // Intentamos encontrar el valor en el orden de prioridad: Exacto -> Normalizado
    if (data[h] !== undefined) return data[h];
    if (data[cleanHeader] !== undefined) return data[cleanHeader];
    
    return "";
  });

  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    sheet.appendRow(rowData);
  }
  return responseJSON({ status: 'success' });
}

function deleteData(ss, type, id) {
  const sheetName = type === 'proyecto' ? 'Proyectos' : type === 'unidad' ? 'Unidades' : 'Rondas';
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return responseJSON({ status: 'error' });
  const rows = sheet.getDataRange().getValues();
  for (let i = rows.length - 1; i >= 1; i--) {
    if (String(rows[i][0]) === String(id)) sheet.deleteRow(i + 1);
  }
  return responseJSON({ status: 'success' });
}

function responseJSON(d) {
  return ContentService.createTextOutput(JSON.stringify(d)).setMimeType(ContentService.MimeType.JSON);
}
