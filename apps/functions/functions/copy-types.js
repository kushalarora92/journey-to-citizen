/**
 * Copy types package for Firebase deployment
 * Firebase Cloud Build doesn't support pnpm workspaces,
 * so we copy the built types into a local types folder before deployment
 */

const fs = require('fs');
const path = require('path');

const typesSource = path.join(__dirname, '../../../packages/types/lib');
const typesPackageJson = path.join(__dirname, '../../../packages/types/package.json');
const typesTarget = path.join(__dirname, 'types');

// Create target directory if it doesn't exist
if (!fs.existsSync(typesTarget)) {
  fs.mkdirSync(typesTarget, { recursive: true });
}

// Copy the lib folder
function copyRecursive(src, dest) {
  if (fs.statSync(src).isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(item => {
      copyRecursive(path.join(src, item), path.join(dest, item));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  console.log('Copying types package for deployment...');
  
  // Copy lib contents
  copyRecursive(typesSource, typesTarget);
  
  // Copy package.json
  fs.copyFileSync(typesPackageJson, path.join(typesTarget, 'package.json'));
  
  console.log('✓ Types package copied successfully');
} catch (error) {
  console.error('Error copying types package:', error);
  process.exit(1);
}
