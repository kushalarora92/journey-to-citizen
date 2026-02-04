/**
 * Pack shared packages for Firebase deployment using npm pack
 * This creates proper .tgz files that Cloud Build can install
 * 
 * IMPORTANT: Temporarily removes @journey-to-citizen/types dependency from
 * calculations package before packing, since both packages will be installed
 * in functions/node_modules. This prevents nested file: references that 
 * Cloud Build cannot resolve.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Packing shared packages for deployment...');
  
  // Clean up old .tgz files
  const existingTgz = fs.readdirSync(__dirname).filter(f => f.endsWith('.tgz'));
  existingTgz.forEach(f => {
    fs.unlinkSync(path.join(__dirname, f));
    console.log(`Removed old ${f}`);
  });
  
  // Pack types package (no modifications needed)
  console.log('Packing types...');
  const typesDir = path.join(__dirname, '../../../packages/types');
  const typesOutput = execSync('npm pack', { 
    cwd: typesDir, 
    encoding: 'utf-8' 
  }).trim();
  const typesTgz = typesOutput.split('\n').pop();
  fs.renameSync(
    path.join(typesDir, typesTgz),
    path.join(__dirname, typesTgz)
  );
  console.log(`✓ types packed successfully: ${typesTgz}`);
  
  // Pack calculations package (with temporary dependency removal)
  console.log('Packing calculations...');
  const calcDir = path.join(__dirname, '../../../packages/calculations');
  const calcPkgPath = path.join(calcDir, 'package.json');
  
  // Backup original package.json
  const originalPkg = fs.readFileSync(calcPkgPath, 'utf8');
  
  try {
    // Modify package.json to remove types dependency
    const pkg = JSON.parse(originalPkg);
    if (pkg.dependencies && pkg.dependencies['@journey-to-citizen/types']) {
      delete pkg.dependencies['@journey-to-citizen/types'];
      fs.writeFileSync(calcPkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log('  Temporarily removed types dependency');
    }
    
    // Pack with modified package.json
    const calcOutput = execSync('npm pack', { 
      cwd: calcDir, 
      encoding: 'utf-8' 
    }).trim();
    const calcTgz = calcOutput.split('\n').pop();
    fs.renameSync(
      path.join(calcDir, calcTgz),
      path.join(__dirname, calcTgz)
    );
    console.log(`✓ calculations packed successfully: ${calcTgz}`);
    
  } finally {
    // Always restore original package.json
    fs.writeFileSync(calcPkgPath, originalPkg);
    console.log('  Restored original package.json');
  }
  
  console.log('✓ All packages packed successfully');
} catch (error) {
  console.error('Error packing packages:', error);
  process.exit(1);
}
