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
  if (fields.length < 2) continue;
  const title = fields[0];
  const yearStr = fields[1];
  const id = `award-${i}`;
  
  // Use local assets /assets/Assets/Awards/AwardX.png
  // The first award in CSV ( پنجاب فوٹو فیئر) seems to be Award20 in previous list? 
  // Wait, I'll just use the index for now.
  const imageUrl = `/assets/Assets/Awards/Award${i}.png`;
  
  awards.push({
    id,
    title,
    year: yearStr ? parseInt(yearStr) : undefined,
    imageUrl
  });
}

console.log(JSON.stringify(awards, null, 2));
