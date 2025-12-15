/**
 * VERSIÓN DEL SCRIPT: 2.1 (Soporte para Categorías de Rondas)
 * 
 * INSTRUCCIONES:
 * 1. Pega tu ID de hoja de cálculo abajo.
 * 2. Guarda.
 * 3. IMPORTANTE: Implementar > Gestionar implementaciones > Editar > NUEVA VERSIÓN > Implementar.
 * 4. NOTA: Añade manualmente la columna 'CATEGORIA' en la hoja 'Rondas' si ya tienes datos creados.
 */

const SPREADSHEET_ID = 'TU_ID_DE_HOJA_DE_CALCULO_AQUI'; // <--- PEGA TU ID REAL AQUÍ

// Definición de la estructura de la base de datos
const DB_SCHEMA = {
  'Proyectos': ['ID_PROYECTO', 'NOMBRE_PROYECTO', 'CLIENTE', 'CAMPANA', 'ESTADO'],
  'Unidades': ['ID_UNIDAD', 'ID_PROYECTO', 'CODIGO_UD', 'TITULO_UD', 'FECHA_RECEPCION_ORIGINALES', 'FECHA_LIMITE_PRIMERAS', 'NOTAS'],
  'Rondas': ['ID_RONDA', 'ID_UNIDAD', 'TIPO_RONDA', 'FECHA_RECEPCION', 'FECHA_LIMITE', 'ESTADO', 'ENLACE_ARCHIVO', 'COMENTARIOS', 'CATEGORIA']
};

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(30000);

  try {
    if (SPREADSHEET_ID === 'TU_ID_DE_HOJA_DE_CALCULO_AQUI' || SPREADSHEET_ID === '') {
       throw new Error('CONFIG_ERROR: El ID de la hoja sigue siendo el predeterminado. Edita el script y pon tu ID real.');
    }

    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    ensureDbStructure(ss);

    let postData = null;
    if (e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = e.postData.contents; 
      }
    }

    if (postData) {
      if (postData.action === 'save') {
        const type = postData.type; 
        const data = postData.data;
        let sheetName = getSheetNameByType(type);
        const sheet = ss.getSheetByName(sheetName);
        if (!sheet) throw new Error(`Tabla no encontrada: ${sheetName}`);
        
        const headers = DB_SCHEMA[sheetName];
        const allValues = sheet.getDataRange().getValues();
        let rowIndexToUpdate = -1;
        
        if (allValues.length > 1) {
            for (let i = 1; i < allValues.length; i++) {
              const rowId = allValues[i][0];
              if (String(rowId) === String(data[headers[0]])) {
                rowIndexToUpdate = i + 1;
                break;
              }
            }
        }

        const rowData = headers.map(header => {
          const val = data[header];
          return val === undefined || val === null ? '' : val;
        });

        if (rowIndexToUpdate > 0) {
          sheet.getRange(rowIndexToUpdate, 1, 1, rowData.length).setValues([rowData]);
        } else {
          sheet.appendRow(rowData);
        }
        
        return responseJSON({ status: 'success', action: 'saved', data: data });
      } else if (postData.action === 'delete') {
         const type = postData.type;
         const id = postData.id;
         let sheetName = getSheetNameByType(type);
         const sheet = ss.getSheetByName(sheetName);
         if (!sheet) throw new Error(`Tabla no encontrada: ${sheetName}`);
         
         const allValues = sheet.getDataRange().getValues();
         let rowIndexToDelete = -1;
         
         for (let i = 1; i < allValues.length; i++) {
           const rowId = allValues[i][0];
           if (String(rowId) === String(id)) {
             rowIndexToDelete = i + 1;
             break;
           }
         }
         
         if (rowIndexToDelete > 0) {
           sheet.deleteRow(rowIndexToDelete);
           return responseJSON({ status: 'success', action: 'deleted', id: id });
         } else {
           return responseJSON({ status: 'error', message: 'ID no encontrado' });
         }
      }
    }

    const proyectos = getSheetData(ss, 'Proyectos');
    const unidades = getSheetData(ss, 'Unidades');
    const rondas = getSheetData(ss, 'Rondas');

    return responseJSON({
      status: 'success',
      data: {
        proyectos: proyectos,
        unidades: unidades,
        rondas: rondas,
        spreadsheetUrl: ss.getUrl(),
        spreadsheetName: ss.getName(),
        spreadsheetId: ss.getId(),
        scriptVersion: '2.1'
      }
    });

  } catch (err) {
    return responseJSON({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function getSheetNameByType(type) {
  if (type === 'proyecto') return 'Proyectos';
  if (type === 'unidad') return 'Unidades';
  if (type === 'ronda') return 'Rondas';
  return '';
}

function ensureDbStructure(ss) {
  Object.keys(DB_SCHEMA).forEach(sheetName => {
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) sheet = ss.insertSheet(sheetName);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(DB_SCHEMA[sheetName]);
      sheet.setFrozenRows(1);
    }
  });
}

function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const range = sheet.getDataRange();
  const values = range.getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  const data = [];
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const obj = {};
    if (row[0] === '' || row[0] === null) continue;
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j];
    }
    data.push(obj);
  }
  return data;
}

function responseJSON(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}