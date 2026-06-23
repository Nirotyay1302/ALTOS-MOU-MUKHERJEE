const fs=require('fs');
const db=fs.readFileSync('database.js','utf8');
const ids=[...db.matchAll(/id:\s*"(\d{5})"/g)].map(m=>m[1]);
const s=fs.readFileSync('public/product-list.html','utf8');
const present=new Set([...s.matchAll(/\b\d{5}\b/g)].map(m=>m[0]));
console.log('DB IDs: ', ids.join(', '));
ids.forEach(id=>console.log(id, present.has(id)?'PRESENT':'MISSING'));
console.log('Total unique codes in product-list.html =', new Set([...s.matchAll(/\b\d{5}\b/g)].map(m=>m[0])).size);
