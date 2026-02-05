const { execSync } = require('child_process');

function isTracked(path) {
  try {
    execSync(`git ls-files --error-unmatch "${path}"`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

const pathsToCheck = ['.env', 'backend/.env'];
const tracked = pathsToCheck.filter(isTracked);

if (tracked.length) {
  console.error('\nERROR: The following .env files are committed to the repo (this is a security risk):');
  tracked.forEach(p => console.error(' - ' + p));
  console.error('\nPlease remove them from the repository with:');
  console.error('  git rm --cached <file> && git commit -m "Remove committed .env files"');
  process.exit(1);
}

console.log('OK: No committed .env files found');
process.exit(0);
