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

const csvContent = fs.readFileSync('awards_info.csv', 'utf8');
const csvLines = csvContent.split('\n').filter(l => l.trim());

const awardsTsx = fs.readFileSync('src/screens/Awards.tsx', 'utf8');

for (let i = 1; i < csvLines.length; i++) {
  const fields = parseLine(csvLines[i]);
  const title = fields[0];
  const url = fields[2] || '';
  
  const filename = url.split('/').pop();
  const match = filename.match(/(\d+)/);
  let expectedNum = match ? match[1] : '';
  if (filename === '1-2-1.jpg') expectedNum = '1';
  if (filename === '2-ptif-1.png') expectedNum = '2';
  
  const expectedImg = `/assets/Assets/Awards/Award${expectedNum}.png`;
  
  // Find in TSX
  if (!awardsTsx.includes(title)) {
      console.log(`Title not found: ${title}`);
      continue;
  }
  
  if (!awardsTsx.includes(expectedImg)) {
      console.log(`Mismatch for ${title}: expected ${expectedImg}`);
  }
}
