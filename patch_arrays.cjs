const fs = require('fs');
const path = require('path');

function replaceFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  let original = content;

  const regex = /(?<![\)\]])\b([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)\.map\(/g;
  
  content = content.replace(regex, function(match, p1) {
    if (p1 === 'Math' || p1 === 'Object' || p1 === 'Promise' || p1 === 'Array') return match;
    if (['25', '50', '75', '100', '3', '6', '12'].includes(p1)) return match;
    return `(${p1} || []).map(`;
  });

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log('Patched ' + filepath);
  }
}

function walk(dir) {
    if(dir.includes('node_modules') || dir.includes('dist') || dir.includes('.git')) return;
    const files = fs.readdirSync(dir);
    for(const file of files) {
        const fullpath = path.join(dir, file);
        if(fs.statSync(fullpath).isDirectory()) {
            walk(fullpath);
        } else if (fullpath.endsWith('.tsx') || fullpath.endsWith('.ts')) {
            replaceFile(fullpath);
        }
    }
}
walk('.');
