const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf8');
const search = `    // Sanitize Incomes`;
const replace = `    // Sanitize People
    safeState.people = (safeState.people || []).map(p => ({
        ...p,
        age: ensureFinite(p.age, 30)
    }));

    // Sanitize Incomes`;
code = code.replace(search, replace);
fs.writeFileSync('App.tsx', code);
