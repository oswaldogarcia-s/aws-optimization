export default class ProgressBar {
    private total: number;
    private width: number;

    constructor(total: number, width: number = 20) {
        this.total = total; // valor máximo (por ejemplo, 100%)
        this.width = width; // ancho de la barra en caracteres
    }

    public update(current: number): void {
        const porcentaje = Math.min((current / this.total) * 100, 100);
        const progreso = Math.round((porcentaje / 100) * this.width);
        const barra = "█".repeat(progreso) + "-".repeat(this.width - progreso);

        process.stdout.write(`\r[${barra}] ${porcentaje.toFixed(1)}%`);
        
        if (porcentaje >= 100) {
            process.stdout.write("\nCompletado \n");
        }
    }
}