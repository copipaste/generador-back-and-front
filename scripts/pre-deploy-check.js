// @ts-nocheck
/**
 * Script de verificación pre-deploy
 * Ejecuta: node scripts/pre-deploy-check.js
 */

import { execSync } from 'child_process';
import fs from 'fs';

const checks = {
  passed: [],
  failed: [],
  warnings: []
};

function log(emoji, message, type = 'info') {
  const colors = {
    info: '\x1b[36m',
    success: '\x1b[32m',
    error: '\x1b[31m',
    warning: '\x1b[33m',
    reset: '\x1b[0m'
  };
  console.log(`${colors[type]}${emoji} ${message}${colors.reset}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    checks.passed.push(description);
    log('✅', `${description}: Encontrado`, 'success');
    return true;
  } else {
    checks.failed.push(description);
    log('❌', `${description}: No encontrado`, 'error');
    return false;
  }
}

function runCommand(command, description) {
  try {
    log('🔍', `Verificando: ${description}...`, 'info');
    execSync(command, { stdio: 'pipe' });
    checks.passed.push(description);
    log('✅', `${description}: OK`, 'success');
    return true;
  } catch (error) {
    checks.failed.push(description);
    log('❌', `${description}: Error`, 'error');
    return false;
  }
}

console.log('\n🚀 Verificación Pre-Deploy - Figma Clone\n');
console.log('='.repeat(50));

// 1. Verificar archivos esenciales
console.log('\n📁 Verificando archivos esenciales...\n');
checkFile('package.json', 'package.json');
checkFile('next.config.js', 'next.config.js');
checkFile('vercel.json', 'vercel.json');
checkFile('.env.example', '.env.example');
checkFile('DEPLOYMENT.md', 'Documentación de despliegue');
checkFile('prisma/schema.prisma', 'Schema de Prisma');
checkFile('src/env.js', 'Validación de variables de entorno');

// 2. Verificar que .env no esté en git
console.log('\n🔐 Verificando seguridad...\n');
if (!fs.existsSync('.env') || fs.readFileSync('.gitignore', 'utf-8').includes('.env')) {
  checks.passed.push('Archivo .env protegido');
  log('✅', 'Archivo .env está en .gitignore', 'success');
} else {
  checks.failed.push('Archivo .env no está protegido');
  log('❌', 'PELIGRO: .env puede estar expuesto', 'error');
}

// 3. Verificar TypeScript
console.log('\n📘 Verificando TypeScript...\n');
runCommand('npm run typecheck', 'TypeScript sin errores');

// 4. Verificar ESLint
console.log('\n🔍 Verificando ESLint...\n');
runCommand('npm run lint', 'ESLint sin errores');

// 5. Verificar Build
console.log('\n🏗️  Verificando Build de Next.js...\n');
runCommand('npm run build', 'Build exitoso');

// 6. Verificar dependencias
console.log('\n📦 Verificando dependencias...\n');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const requiredDeps = [
  'next',
  'react',
  'react-dom',
  'prisma',
  '@prisma/client',
  'next-auth',
  '@liveblocks/client',
  '@google/genai'
];

let allDepsPresent = true;
requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep] || packageJson.devDependencies?.[dep]) {
    log('✅', `Dependencia "${dep}" instalada`, 'success');
  } else {
    allDepsPresent = false;
    checks.failed.push(`Falta dependencia: ${dep}`);
    log('❌', `Falta dependencia: ${dep}`, 'error');
  }
});

if (allDepsPresent) {
  checks.passed.push('Todas las dependencias instaladas');
}

// 7. Verificar scripts necesarios
console.log('\n📜 Verificando scripts de package.json...\n');
const requiredScripts = ['build', 'start', 'postinstall', 'db:push'];
requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    checks.passed.push(`Script "${script}" presente`);
    log('✅', `Script "${script}" configurado`, 'success');
  } else {
    checks.warnings.push(`Script "${script}" no encontrado`);
    log('⚠️', `Script "${script}" no encontrado`, 'warning');
  }
});

// 8. Verificar que no haya secrets en el código
console.log('\n🔒 Buscando posibles secrets en el código...\n');
const dangerousPatterns = [
  'AIzaSy',
  'sk_live_',
  'pk_live_',
  'postgres://.*:.*@'
];

let foundSecrets = false;
dangerousPatterns.forEach(pattern => {
  try {
    const result = execSync(`git grep -i "${pattern}" -- "*.ts" "*.tsx" "*.js" "*.jsx" || exit 0`, { encoding: 'utf-8' });
    if (result.trim()) {
      foundSecrets = true;
      checks.warnings.push(`Posible secret encontrado: ${pattern}`);
      log('⚠️', `ADVERTENCIA: Posible secret encontrado (patrón: ${pattern})`, 'warning');
    }
  } catch (error) {
    // Ignorar errores (no git, etc.)
  }
});

if (!foundSecrets) {
  checks.passed.push('No se encontraron secrets en el código');
  log('✅', 'No se detectaron secrets en archivos fuente', 'success');
}

// Resumen final
console.log('\n' + '='.repeat(50));
console.log('\n📊 RESUMEN DE VERIFICACIÓN\n');

log('✅', `Verificaciones exitosas: ${checks.passed.length}`, 'success');
if (checks.warnings.length > 0) {
  log('⚠️', `Advertencias: ${checks.warnings.length}`, 'warning');
}
if (checks.failed.length > 0) {
  log('❌', `Errores: ${checks.failed.length}`, 'error');
}

if (checks.failed.length > 0) {
  console.log('\n❌ ERRORES ENCONTRADOS:');
  checks.failed.forEach(error => console.log(`  - ${error}`));
}

if (checks.warnings.length > 0) {
  console.log('\n⚠️  ADVERTENCIAS:');
  checks.warnings.forEach(warning => console.log(`  - ${warning}`));
}

console.log('\n' + '='.repeat(50));

if (checks.failed.length === 0) {
  log('🎉', '¡TODO LISTO PARA DESPLEGAR!', 'success');
  console.log('\nPróximos pasos:');
  console.log('1. Sube el código a GitHub: git push');
  console.log('2. Importa el proyecto en Vercel');
  console.log('3. Configura las variables de entorno');
  console.log('4. Despliega y ejecuta las migraciones');
  console.log('\nConsulta DEPLOYMENT.md para más detalles.\n');
  process.exit(0);
} else {
  log('⛔', 'CORRIGE LOS ERRORES ANTES DE DESPLEGAR', 'error');
  console.log('\nConsulta los errores arriba y corrígelos.\n');
  process.exit(1);
}


console.log('\n🚀 Verificación Pre-Deploy - Figma Clone\n');
console.log('='.repeat(50));

// 1. Verificar archivos esenciales
console.log('\n📁 Verificando archivos esenciales...\n');
checkFile('package.json', 'package.json');
checkFile('next.config.js', 'next.config.js');
checkFile('vercel.json', 'vercel.json');
checkFile('.env.example', '.env.example');
checkFile('DEPLOYMENT.md', 'Documentación de despliegue');
checkFile('prisma/schema.prisma', 'Schema de Prisma');
checkFile('src/env.js', 'Validación de variables de entorno');

// 2. Verificar que .env no esté en git
console.log('\n🔐 Verificando seguridad...\n');
if (!fs.existsSync('.env') || fs.readFileSync('.gitignore', 'utf-8').includes('.env')) {
  checks.passed.push('Archivo .env protegido');
  log('✅', 'Archivo .env está en .gitignore', 'success');
} else {
  checks.failed.push('Archivo .env no está protegido');
  log('❌', 'PELIGRO: .env puede estar expuesto', 'error');
}

// 3. Verificar TypeScript
console.log('\n📘 Verificando TypeScript...\n');
runCommand('npm run typecheck', 'TypeScript sin errores');

// 4. Verificar ESLint
console.log('\n🔍 Verificando ESLint...\n');
runCommand('npm run lint', 'ESLint sin errores');

// 5. Verificar Build
console.log('\n🏗️  Verificando Build de Next.js...\n');
runCommand('npm run build', 'Build exitoso');

// 6. Verificar dependencias
console.log('\n📦 Verificando dependencias...\n');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
const requiredDeps = [
  'next',
  'react',
  'react-dom',
  'prisma',
  '@prisma/client',
  'next-auth',
  '@liveblocks/client',
  '@google/genai'
];

let allDepsPresent = true;
requiredDeps.forEach(dep => {
  if (packageJson.dependencies[dep] || packageJson.devDependencies?.[dep]) {
    log('✅', `Dependencia "${dep}" instalada`, 'success');
  } else {
    allDepsPresent = false;
    checks.failed.push(`Falta dependencia: ${dep}`);
    log('❌', `Falta dependencia: ${dep}`, 'error');
  }
});

if (allDepsPresent) {
  checks.passed.push('Todas las dependencias instaladas');
}

// 7. Verificar scripts necesarios
console.log('\n📜 Verificando scripts de package.json...\n');
const requiredScripts = ['build', 'start', 'postinstall', 'db:push'];
requiredScripts.forEach(script => {
  if (packageJson.scripts[script]) {
    checks.passed.push(`Script "${script}" presente`);
    log('✅', `Script "${script}" configurado`, 'success');
  } else {
    checks.warnings.push(`Script "${script}" no encontrado`);
    log('⚠️', `Script "${script}" no encontrado`, 'warning');
  }
});

// 8. Verificar que no haya secrets en el código
console.log('\n🔒 Buscando posibles secrets en el código...\n');
const dangerousPatterns = [
  'AIzaSy',
  'sk_live_',
  'pk_live_',
  'postgres://.*:.*@'
];

let foundSecrets = false;
dangerousPatterns.forEach(pattern => {
  try {
    const result = execSync(`git grep -i "${pattern}" -- "*.ts" "*.tsx" "*.js" "*.jsx" || exit 0`, { encoding: 'utf-8' });
    if (result.trim()) {
      foundSecrets = true;
      checks.warnings.push(`Posible secret encontrado: ${pattern}`);
      log('⚠️', `ADVERTENCIA: Posible secret encontrado (patrón: ${pattern})`, 'warning');
    }
  } catch (error) {
    // Ignorar errores (no git, etc.)
  }
});

if (!foundSecrets) {
  checks.passed.push('No se encontraron secrets en el código');
  log('✅', 'No se detectaron secrets en archivos fuente', 'success');
}

// Resumen final
console.log('\n' + '='.repeat(50));
console.log('\n📊 RESUMEN DE VERIFICACIÓN\n');

log('✅', `Verificaciones exitosas: ${checks.passed.length}`, 'success');
if (checks.warnings.length > 0) {
  log('⚠️', `Advertencias: ${checks.warnings.length}`, 'warning');
}
if (checks.failed.length > 0) {
  log('❌', `Errores: ${checks.failed.length}`, 'error');
}

if (checks.failed.length > 0) {
  console.log('\n❌ ERRORES ENCONTRADOS:');
  checks.failed.forEach(error => console.log(`  - ${error}`));
}

if (checks.warnings.length > 0) {
  console.log('\n⚠️  ADVERTENCIAS:');
  checks.warnings.forEach(warning => console.log(`  - ${warning}`));
}

console.log('\n' + '='.repeat(50));

if (checks.failed.length === 0) {
  log('🎉', '¡TODO LISTO PARA DESPLEGAR!', 'success');
  console.log('\nPróximos pasos:');
  console.log('1. Sube el código a GitHub: git push');
  console.log('2. Importa el proyecto en Vercel');
  console.log('3. Configura las variables de entorno');
  console.log('4. Despliega y ejecuta las migraciones');
  console.log('\nConsulta DEPLOYMENT.md para más detalles.\n');
  process.exit(0);
} else {
  log('⛔', 'CORRIGE LOS ERRORES ANTES DE DESPLEGAR', 'error');
  console.log('\nConsulta los errores arriba y corrígelos.\n');
  process.exit(1);
}
