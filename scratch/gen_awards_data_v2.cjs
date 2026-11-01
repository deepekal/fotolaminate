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

const content = fs.readFileSync('awards_info.csv', 'utf8');
const lines = content.split('\n');

const awards = [];
for (let i = 1; i < lines.length; i++) {
  const fields = parseLine(lines[i]);
  if (fields.length < 3) continue;
  const title = fields[0];
  const yearStr = fields[1];
  const url = fields[2];
  const id = `award-${i}`;
  
  // Extract number from URL like "20-ptif.png" or "1-2-1.jpg"
  const filename = url.split('/').pop();
  const match = filename.match(/(\d+)/); 
  let num = match ? match[1] : '';
  
  // Custom fixes for weird names
  if (filename === '1-2-1.jpg') num = '1';
  if (filename === '2-ptif-1.png') num = '2';
  
  const imageUrl = num ? `/assets/Assets/Awards/Award${num}.png` : '';
  
  awards.push({
    id,
    title,
    year: yearStr ? parseInt(yearStr) : undefined,
    imageUrl: imageUrl || `/assets/Assets/Awards/Award${i}.png` // fallback
  });
}

console.log(JSON.stringify(awards, null, 2));
