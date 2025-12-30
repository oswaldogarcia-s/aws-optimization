import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';

const execPromise = util.promisify(exec);

interface OverrideEntry {
  name: string;
  version: string;
}

export default class SnykScanner {
  updatableLibs: string[] = [];
  overrideLibs: OverrideEntry[] = [];

  constructor(private projectPath: string) { }

  async runTest() {
    try {
      const { stdout, stderr } = await execPromise('snyk test', { cwd: this.projectPath });

      if (stderr) {
        console.error('Snyk stderr:', stderr);
      }

      console.log('stdout: ', stdout);

      this.parseOutput(stdout);
    } catch (error: any) {
      if (error.stdout) {
        if (error.stderr) console.error('Snyk stderr:', error.stderr);
        this.parseOutput(error.stdout);
      } else {
        console.error('Error ejecutando snyk test:', error.message);
      }
    }
  }

  private parseOutput(output: string) {
    const lines = output.split('\n');

    let currentLib: string | null = null;
    let fixedVersions: string[] = [];
    let inNoDirectUpgradeSection = false;

    for (const line of lines) {
      // Detectar inicio de sección sin upgrade directo
      if (line.includes('Issues with no direct upgrade or patch')) {
        inNoDirectUpgradeSection = true;
        continue;
      }

      // Detectar vulnerabilidad
      const vulnMatch = line.match(/in ([a-zA-Z0-9-_@/]+)@([\d.]+)/);
      if (vulnMatch) {
        currentLib = vulnMatch[1];
        fixedVersions = [];
      }

      // Detectar versiones fijas disponibles
      const fixMatch = line.match(/This issue was fixed in versions?: (.+)/);
      if (fixMatch && currentLib) {
        fixedVersions = fixMatch[1].split(',').map(v => v.trim());

        if (fixedVersions.length > 0) {
          if (inNoDirectUpgradeSection) {
            // Caso override con versión recomendada
            this.overrideLibs.push({ name: currentLib, version: fixedVersions[fixedVersions.length - 1] });
          } else {
            // Caso actualizable directamente
            this.updatableLibs.push(currentLib);
          }
        }
        currentLib = null;
      }
    }
  }

  async updateLibs() {
    if (this.updatableLibs.length === 0) {
      console.log('No hay librerías para actualizar.');
      return;
    }

    console.log(`Actualizando ${this.updatableLibs.length} librerías...`);

    const libsStr = this.updatableLibs.join(' ');
    try {
      console.log(`→ npm update ${libsStr}`);
      const { stdout, stderr } = await execPromise(`npm update ${libsStr}`, { cwd: this.projectPath });

      if (stdout) console.log(stdout);
      if (stderr) console.error(stderr);
    } catch (error: any) {
      console.error(`Error actualizando librerías:`, error.message);
    }

    console.log('✅ Actualización de librerías completada.');
  }

  async applyOverrides() {
    if (this.overrideLibs.length === 0) {
      console.log('No hay librerías para override.');
      return;
    }

    const packageJsonPath = path.join(this.projectPath, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    if (!packageJson.overrides) {
      packageJson.overrides = {};
    }

    for (const { name, version } of this.overrideLibs) {
      packageJson.overrides[name] = version;
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');

    console.log(`✅ Overrides agregados en package.json:`);
    this.overrideLibs.forEach(o => console.log(`   ${o.name} → ${o.version}`));

    console.log('Recuerda ejecutar: npm install para aplicar los overrides.');
  }

  async resetDependencies() {
    try {
      console.log('🗑️ Eliminando node_modules y package-lock.json en: ', this.projectPath);
      await execPromise('rm -rf ./node_modules ./package-lock.json', { cwd: this.projectPath });

      console.log('📦 Reinstalando dependencias...');
      await execPromise('npm install', { cwd: this.projectPath });

      console.log('✅ Dependencias reinstaladas correctamente.');
    } catch (error: any) {
      console.error('❌ Error al reiniciar dependencias:', error.message);
    }
  }
}
