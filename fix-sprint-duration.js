const fs = require('fs');
const file = 'src/app/admin/hackathons/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Revert datetime-local back to date
content = content.replace(/type="datetime-local"/g, 'type="date"');

// Fix handleEditSave payload
content = content.replace(
  'hasFee,\n    };\n\n    try {\n      const res = await fetch',
  'hasFee,\n    };\n\n    // Calculate end date based on duration for sprint edits\n    if (editingHackathon.parentHackathonId) {\n      const dur = Number(editSprintDuration);\n      if (!isNaN(dur)) {\n        payload.endDate = new Date(new Date(startDate).getTime() + dur * 60 * 1000).toISOString().split(\'T\')[0];\n      }\n    }\n\n    try {\n      const res = await fetch'
);

fs.writeFileSync(file, content);
console.log('Fixed');
