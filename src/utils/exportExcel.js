import * as XLSX from 'xlsx-js-style';

function applyStyles(ws, dataLength) {
  if (!ws['!ref']) return;

  const range = XLSX.utils.decode_range(ws['!ref']);
  
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = { c: C, r: R };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      
      if (!ws[cellRef]) continue;

      // Judul Laporan (Baris 1)
      if (R === 0) {
        ws[cellRef].s = {
          font: { bold: true, sz: 16, color: { rgb: "FF111827" } }, // text-gray-900
          alignment: { vertical: 'center', horizontal: 'center' }
        };
        continue;
      }
      
      // Sub-judul / Tanggal (Baris 2)
      if (R === 1) {
        ws[cellRef].s = {
          font: { italic: true, sz: 11, color: { rgb: "FF6B7280" } }, // text-gray-500
          alignment: { vertical: 'center', horizontal: 'center' }
        };
        continue;
      }

      // Base style untuk tabel (Mulai dari Baris 3 ke bawah)
      const baseStyle = {
        border: {
          top: { style: 'thin', color: { rgb: "FFCCCCCC" } },
          bottom: { style: 'thin', color: { rgb: "FFCCCCCC" } },
          left: { style: 'thin', color: { rgb: "FFCCCCCC" } },
          right: { style: 'thin', color: { rgb: "FFCCCCCC" } }
        },
        alignment: {
          vertical: 'center',
          horizontal: 'left',
          wrapText: true
        }
      };

      // Header Tabel (Baris 3)
      if (R === 2) {
        ws[cellRef].s = {
          ...baseStyle,
          font: { bold: true, color: { rgb: "FFFFFFFF" }, sz: 12 },
          fill: { fgColor: { rgb: "FF4F46E5" } }, // Indigo-600
          alignment: { vertical: 'center', horizontal: 'center' }
        };
      } else {
        // Stripe style (Baris data tabel)
        const isEven = R % 2 === 0;
        ws[cellRef].s = {
          ...baseStyle,
          font: { sz: 11, color: { rgb: "FF333333" } },
          fill: isEven ? { fgColor: { rgb: "FFF9FAFB" } } : { fgColor: { rgb: "FFFFFFFF" } }
        };
      }
    }
  }
}

/**
 * Helper untuk setup struktur sheet (Judul, Header, Data)
 */
function createFormattedSheet(data, title) {
  // Tambahkan data JSON tapi mulai dari baris 3 (A3)
  const ws = XLSX.utils.json_to_sheet(data, { origin: 'A3' });
  const colCount = Object.keys(data[0]).length;

  // Format Text Header Tabel (di baris 3)
  const range = XLSX.utils.decode_range(ws['!ref']);
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const cellRef = XLSX.utils.encode_cell({ c: C, r: 2 });
    if (ws[cellRef] && ws[cellRef].v) {
      const headerText = ws[cellRef].v.toString().replace(/_/g, ' ');
      ws[cellRef].v = headerText.charAt(0).toUpperCase() + headerText.slice(1);
    }
  }

  // Tambahkan Judul di Baris 1
  XLSX.utils.sheet_add_aoa(ws, [[`LAPORAN ${title.toUpperCase()}`]], { origin: 'A1' });
  
  // Tambahkan Tanggal Generate di Baris 2
  const dateStr = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
  XLSX.utils.sheet_add_aoa(ws, [[`Dicetak pada: ${dateStr}`]], { origin: 'A2' });

  // Merge Cell untuk Judul dan Tanggal agar ketengah
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } }, // Merge baris 1
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } }  // Merge baris 2
  ];

  // Auto-size columns dengan padding lebih
  const colWidths = Object.keys(data[0]).map(key => {
    const maxLength = Math.max(
      key.length,
      ...data.map(row => String(row[key] ?? '').length)
    );
    return { wch: maxLength + 5 }; // +5 padding
  });
  ws['!cols'] = colWidths;

  applyStyles(ws, data.length);
  return ws;
}

/**
 * Export data ke file Excel (.xlsx) dengan styling
 */
export function exportToExcel(data, filename = 'export', sheetName = 'Sheet1') {
  if (!data || data.length === 0) {
    alert('Tidak ada data untuk diekspor.');
    return;
  }

  const ws = createFormattedSheet(data, sheetName);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export multiple sheets ke satu file Excel dengan styling
 */
export function exportMultiSheetExcel(sheets, filename = 'export') {
  const wb = XLSX.utils.book_new();
  sheets.forEach(({ name, data }) => {
    if (data && data.length > 0) {
      const ws = createFormattedSheet(data, name);
      XLSX.utils.book_append_sheet(wb, ws, name);
    }
  });
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
