import fs from 'fs';
import path from 'path';
import { parse } from 'yaml';

export default class YamlLoader {
  private baseFile: string;
  private data: any;

  constructor(baseFile: string) {
    this.baseFile = baseFile;
    this.data = null;
  }

  /**
   * Carga el YAML principal y resuelve las referencias ${file(...):...}
   */
  public load(): any {
    try {
      const content = fs.readFileSync(this.baseFile, 'utf8');
      const parsed = parse(content);
      this.data = this.resolveIncludes(parsed, this.baseFile);
      return this.data;
    } catch (error) {
      console.error('Error to load: ', error);
      console.log('baseFile: ', this.baseFile);
      throw error;
    }
  }

  /**
   * Obtiene un nodo específico del YAML ya cargado
   */
  public getNode<T>(key: string): T {
    if (!this.data) {
      throw new Error('El YAML no ha sido cargado. Llama primero a load().');
    }
    return this.data[key];
  }

  /**
   * Resuelve recursivamente las referencias ${file(...):...}
   * - Solo procesa .yml/.yaml
   * - Expande arrays incluidos
   */
  private resolveIncludes(obj: any, currentFile: string): any {
    if (Array.isArray(obj)) {
      let result: any[] = [];
      for (const item of obj) {
        const resolvedItem = this.resolveIncludes(item, currentFile);
        if (Array.isArray(resolvedItem)) {
          result = result.concat(resolvedItem); // expandir arrays incluidos
        } else {
          result.push(resolvedItem);
        }
      }
      return result;
    } else if (typeof obj === 'object' && obj !== null) {
      const resolved: any = {};
      for (const key in obj) {
        resolved[key] = this.resolveIncludes(obj[key], currentFile);
      }
      return resolved;
    } else if (typeof obj === 'string') {
      const match = obj.match(/^\$\{file\((.+?)\):(.+?)\}$/);
      if (match && (match[1].endsWith('.yml') || match[1].endsWith('.yaml'))) {
        const includePath = path.resolve(path.dirname(currentFile), match[1]);
        const includeContent = parse(fs.readFileSync(includePath, 'utf8'));
        return this.resolveIncludes(includeContent[match[2]], includePath);
      }
      return obj;
    }
    return obj;
  }
}
