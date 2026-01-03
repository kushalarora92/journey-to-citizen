/**
 * Copy shared packages for Firebase deployment
 * Firebase Cloud Build doesn't support pnpm workspaces,
 * so we copy the built packages into local folders before deployment
 */

const fs = require('fs');
const path = require('path');

// Package configurations
const packages = [
  {
    name: 'types',
    source: path.join(__dirname, '../../../packages/types/lib'),
    packageJson: path.join(__dirname, '../../../packages/types/package.json'),
    target: path.join(__dirname, 'types'),
  },
  {
    name: 'calculations',
    source: path.join(__dirname, '../../../packages/calculations/lib'),
    packageJson: path.join(__dirname, '../../../packages/calculations/package.json'),
    target: path.join(__dirname, 'calculations'),
  },
];

// Copy function
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
  console.log('Copying shared packages for deployment...');
  
  packages.forEach(pkg => {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(pkg.target)) {
      fs.mkdirSync(pkg.target, { recursive: true });
    }
    
    // Copy lib contents
    copyRecursive(pkg.source, pkg.target);
    
    // Read and modify package.json to update dependencies
    const packageJsonContent = JSON.parse(fs.readFileSync(pkg.packageJson, 'utf8'));
    
    // If this package depends on @journey-to-citizen/types, update the path
    if (packageJsonContent.dependencies && packageJsonContent.dependencies['@journey-to-citizen/types']) {
      packageJsonContent.dependencies['@journey-to-citizen/types'] = 'file:../types';
    }
    
    // Write modified package.json
    fs.writeFileSync(
      path.join(pkg.target, 'package.json'),
      JSON.stringify(packageJsonContent, null, 2)
    );
    
    console.log(`✓ ${pkg.name} package copied successfully`);
  });
  
  console.log('✓ All packages copied successfully');
} catch (error) {
  console.error('Error copying packages:', error);
  process.exit(1);
}
