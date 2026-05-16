import * as XLSX from 'xlsx';

export function exportCSV(seatingPlan, nRows, nCols, aisles, filename = '座位表.csv') {
  const rows = [];
  const headerRow = [];
  for (let c = 0; c < nCols; c++) {
    if (aisles.includes(c + 1)) {
      headerRow.push('');
      headerRow.push('过道');
    } else {
      headerRow.push('');
    }
  }
  rows.push(headerRow.join(','));

  for (let r = 0; r < nRows; r++) {
    const rowData = [];
    for (let c = 0; c < nCols; c++) {
      const student = seatingPlan[r]?.[c];
      rowData.push(student ? student.name : '');
      if (aisles.includes(c + 1)) {
        rowData.push('|');
      }
    }
    rows.push(rowData.join(','));
  }

  const bom = '\uFEFF';
  const csvContent = bom + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export function exportExcel(seatingPlan, nRows, nCols, aisles, filename = '座位表.xlsx') {
  const sheetData = [];

  sheetData.push(['讲台']);
  for (let r = 0; r < nRows; r++) {
    const rowData = [];
    for (let c = 0; c < nCols; c++) {
      const student = seatingPlan[r]?.[c];
      rowData.push(student ? `${student.name}(${student.gender})` : '');
      if (aisles.includes(c + 1)) {
        rowData.push('┊');
      }
    }
    sheetData.push(rowData);
  }

  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '座位表');
  XLSX.writeFile(wb, filename);
}

export async function exportPNG(element, filename = '座位表.png') {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
