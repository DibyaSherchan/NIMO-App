const fs = require('fs');
const path = require('path');

// Files that need to be updated based on the error messages
const filesToUpdate = [
  './app/api/adminApplicant/route.ts',
  './app/api/adminMedical/route.ts',
  './app/api/applicants/route.ts',
  './app/api/employee/application/route.ts',
  './app/api/employee/download/route.ts',
  './app/registration/page.tsx',
  './app/api/applicants/[id]/route.ts',
  './app/api/payment/route.ts'
];

console.log('🔧 Starting NextAuth v5 migration...\n');

filesToUpdate.forEach(filePath => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${filePath} - file not found`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Pattern 1: import { getServerSession } from "next-auth/next";
    if (content.includes('import { getServerSession } from "next-auth/next"')) {
      content = content.replace(
        /import { getServerSession } from "next-auth\/next";/g,
        'import { auth } from "@/lib/auth";'
      );
      modified = true;
    }

    // Pattern 2: import { getServerSession } from "next-auth";
    if (content.includes('import { getServerSession } from "next-auth"')) {
      content = content.replace(
        /import { getServerSession } from "next-auth";/g,
        'import { auth } from "@/lib/auth";'
      );
      modified = true;
    }

    // Remove authOptions import if it exists (since we don't need it anymore)
    if (content.includes('import { authOptions } from "@/lib/auth"')) {
      content = content.replace(
        /import { authOptions } from "@\/lib\/auth";\n?/g,
        ''
      );
      modified = true;
    }

    // Replace getServerSession(authOptions) with auth()
    if (content.includes('getServerSession(authOptions)')) {
      content = content.replace(
        /getServerSession\(authOptions\)/g,
        'auth()'
      );
      modified = true;
    }

    // Replace await getServerSession(authOptions) with await auth()
    if (content.includes('await getServerSession(')) {
      content = content.replace(
        /await getServerSession\([^)]*\)/g,
        'await auth()'
      );
      modified = true;
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
});

console.log('\n📝 Next steps:');
console.log('1. Update your lib/auth.ts file to export the auth function');
console.log('2. Run: npm install uuid @types/uuid');
console.log('3. Run: npm run build');
console.log('\n✨ Migration script complete!');
