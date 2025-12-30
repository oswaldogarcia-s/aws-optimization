import fs from 'fs';

const codeToInsert = `
// Disable logs on production
const isProd = process.env.STAGE === 'prod';
const originalLog = console.log;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
console.log = (...args: any[]) => {
  if (!isProd) {
    originalLog(...args);
  }
};
`;

export default function addOffConsoleOnProd(filePath: string) {
  try {
    // Leer archivo si existe
    if (fs.existsSync(filePath)) {
      const fileContent = fs.readFileSync(filePath, 'utf8');

      // Verificar si el código ya está presente
      if (!fileContent.includes('Disable logs on production')) {
        fs.appendFileSync(filePath, codeToInsert);
        console.log('Código insertado correctamente.');
      } else {
        console.log('El código ya existe en el archivo.');
      }
    } else {
      // Crear archivo con el código
      fs.writeFileSync(filePath, codeToInsert);
      console.log('Archivo creado con el código.');
    }
  } catch (error) {
    console.error('Error al insertar el código:', error);
    throw error;
  }
}