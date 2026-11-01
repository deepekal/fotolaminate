const fs = require('fs');
const content = fs.readFileSync('all_products_info.csv', 'utf8');

// Simple CSV parser for this specific multiline format
function parseCsv(text) {
  const lines = text.split('\n');
  const rows = [];
  let currentAction = null;
  let currentFields = [];
  let inQuote = false;
  let currentField = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i+1];

    if (char === '"') {
      if (inQuote && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (char === ',' && !inQuote) {
      currentFields.push(currentField);
      currentField = '';
    } else if (char === '\n' && !inQuote) {
      currentFields.push(currentField);
      rows.push(currentFields);
      currentFields = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  return rows;
}

const rows = parseCsv(content);
console.log('Total rows:', rows.length);
const rowsWithSpecs = rows.filter(r => r[3] && r[3].trim());
console.log('Rows with specs:', rowsWithSpecs.length);
const rowsWithFeatures = rows.filter(r => r[4] && r[4].trim());
console.log('Rows with features:', rowsWithFeatures.length);

if (rowsWithSpecs.length > 0) {
  console.log('Sample spec:', rowsWithSpecs[0][3]);
}
