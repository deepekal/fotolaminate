const fs = require('fs');

function parseLine(line) {
  const fields = [];
  let current = '';
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i+1] === '"') {
        current += '"';
        i++;
      } else {
        inQuote = !inQuote;
      }
    } else if (c === ',' && !inQuote) {
      fields.push(current);
      current = '';
    } else {
      current += c;
    }
  }
  fields.push(current);
  return fields;
}

const content = fs.readFileSync('all_products_info.csv', 'utf8');
const lines = content.split('\n');

for (let i = 1; i < lines.length; i++) {
  const fields = parseLine(lines[i]);
  if (fields.length < 5) continue;
  const name = fields[1];
  const specs = fields[3];
  const features = fields[4];
  
  if (specs && specs.trim() && specs !== '""') {
    console.log(`Product: ${name}`);
    console.log(`Specs: ${specs}`);
  }
  if (features && features.trim() && features !== '""') {
    console.log(`Product: ${name}`);
    console.log(`Features: ${features}`);
  }
}
