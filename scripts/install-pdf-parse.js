/**
 * Script to install pdf-parse library with the necessary flags
 * to avoid dependency conflicts with React 19
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for pdf-parse installation...');

// Check if pdf-parse is already installed
let isPdfParseInstalled = false;
try {
  // Try to require the module
  require.resolve('pdf-parse');
  isPdfParseInstalled = true;
  console.log('✅ pdf-parse is already installed!');
} catch (e) {
  console.log('❌ pdf-parse is not installed. Proceeding with installation...');
}

if (!isPdfParseInstalled) {
  try {
    // Install pdf-parse with legacy-peer-deps flag
    console.log('🔧 Installing pdf-parse with --legacy-peer-deps flag...');
    execSync('npm install pdf-parse --legacy-peer-deps', { stdio: 'inherit' });
    
    console.log('✅ pdf-parse installed successfully!');
    
    // Verify installation
    try {
      require.resolve('pdf-parse');
      console.log('✅ Verified pdf-parse is now accessible.');
    } catch (e) {
      console.error('⚠️ Warning: pdf-parse was installed but cannot be accessed. This might indicate an issue with npm.');
    }
    
    // Create a reminder file for documentation
    const reminderPath = path.join(__dirname, '..', 'pdf-parse-readme.md');
    fs.writeFileSync(reminderPath, `# PDF Parse Installation

The pdf-parse library was installed to enable PDF text extraction in the knowledge base system.

## Installation Details

- Installed with: \`npm install pdf-parse --legacy-peer-deps\`
- Installation date: ${new Date().toISOString()}

## Note on Dependency Conflicts

This installation used the \`--legacy-peer-deps\` flag to bypass dependency conflicts with React 19. 
This approach is a workaround for development purposes. For production deployments, 
consider using a more robust solution like bundling the library or containerization.

## Usage

PDF text extraction should now work properly in the knowledge base system. 
If you encounter any issues, please refer to the documentation in \`/docs/pdf-processing.md\`.
`);
    
    console.log(`📝 Created installation documentation at: ${reminderPath}`);
    console.log('🚀 The system should now be able to extract text from PDF files!');
  } catch (error) {
    console.error('❌ Error installing pdf-parse:', error.message);
    console.log('\n📋 Try installing manually with: npm install pdf-parse --legacy-peer-deps');
  }
} else {
  console.log('✨ pdf-parse is already installed. No action needed.');
  console.log('🚀 Your system should be able to extract text from PDF files!');
}
