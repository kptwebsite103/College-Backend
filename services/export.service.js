const fs = require('fs');
const path = require('path');

// Export data to CSV
function exportToCSV(data, filename, headers = []) {
  if (!Array.isArray(data) || data.length === 0) throw new Error('Data must be a non-empty array');

  const csvHeaders = headers.length > 0 ? headers : Object.keys(data[0]);
  const csvRows = data.map(row => csvHeaders.map(header => `"${row[header] || ''}"`).join(','));

  const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
  const filePath = path.join(process.cwd(), 'exports', filename);

  // Ensure exports directory exists
  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  fs.writeFileSync(filePath, csvContent);
  return filePath;
}

// Export data to JSON
function exportToJSON(data, filename) {
  const jsonContent = JSON.stringify(data, null, 2);
  const filePath = path.join(process.cwd(), 'exports', filename);

  if (!fs.existsSync(path.dirname(filePath))) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  fs.writeFileSync(filePath, jsonContent);
  return filePath;
}

// Placeholder for PDF export (requires additional library like puppeteer)
async function exportToPDF(data, filename) {
  // For now, throw error; implement with puppeteer if added
  throw new Error('PDF export not implemented. Install puppeteer and implement HTML to PDF conversion.');
}

// Placeholder for Excel export (requires library like exceljs)
async function exportToExcel(data, filename) {
  // For now, use CSV as fallback
  return exportToCSV(data, filename.replace('.xlsx', '.csv'));
}

module.exports = {
  exportToCSV,
  exportToJSON,
  exportToPDF,
  exportToExcel,
};