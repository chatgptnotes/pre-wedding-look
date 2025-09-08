const fs = require('fs');
const path = require('path');

// Since we can't easily execute SQL programmatically, let's create 
// separate SQL files for each major section that can be copy-pasted
// into the Supabase SQL editor

const migrationPath = path.join(__dirname, 'supabase/migrations/005_complete_database_setup.sql');
const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

// Split into logical sections
const sections = {
  '01_types_and_functions.sql': '',
  '02_core_tables.sql': '',
  '03_blinddate_tables.sql': '',
  '04_policies.sql': '',
  '05_initial_data.sql': ''
};

// Simple section splitting based on comments
const lines = migrationSQL.split('\n');
let currentSection = '01_types_and_functions.sql';

for (const line of lines) {
  if (line.includes('-- PROFILES TABLE')) {
    currentSection = '02_core_tables.sql';
  } else if (line.includes('-- BLIND DATE MINI GAME TABLES')) {
    currentSection = '03_blinddate_tables.sql';
  } else if (line.includes('-- BASIC RLS POLICIES')) {
    currentSection = '04_policies.sql';
  } else if (line.includes('-- INSERT INITIAL DATA')) {
    currentSection = '05_initial_data.sql';
  }
  
  sections[currentSection] += line + '\n';
}

// Create individual files
const outputDir = path.join(__dirname, 'database-setup');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

Object.entries(sections).forEach(([filename, content]) => {
  if (content.trim()) {
    fs.writeFileSync(path.join(outputDir, filename), content);
    console.log(`Created: database-setup/${filename}`);
  }
});

console.log('\n📋 SETUP INSTRUCTIONS:');
console.log('1. Go to: https://supabase.com/dashboard/project/opchrnceamwydfszzzco/sql/new');
console.log('2. Copy and execute each file in order:');
Object.keys(sections).forEach((filename, index) => {
  if (sections[filename].trim()) {
    console.log(`   ${index + 1}. database-setup/${filename}`);
  }
});
console.log('3. Check for any errors and resolve them');
console.log('4. Verify tables are created in the Table Editor');

console.log('\n🔗 Direct link to SQL Editor:');
console.log('https://supabase.com/dashboard/project/opchrnceamwydfszzzco/sql/new');