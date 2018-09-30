import RenderizadorCanvas from './renderizadorCanvas';
import Chip8 from './chip8';

let jogoCarregado = false;

function enviarPrograma(chip8: Chip8, arquivo: Blob, callback: () => void): void {
    let leitor = new FileReader();
    leitor.onload = function() {
        if (this.result === null || typeof this.result === 'string') {
            throw new Error('Erro ao ler arquivo');
        }

        if (jogoCarregado) {
            chip8.resetar();
        }

        chip8.carregarPrograma(new Uint8Array(this.result));
        callback();
    }

    leitor.readAsArrayBuffer(arquivo);
}

function main(): void {
    let render = new RenderizadorCanvas('canvas#chip-8');
    let chip8 = new Chip8(render);

    const input: HTMLInputElement|null = document.querySelector('input#rom-arquivo');
    if (input === null) {
        console.error('Erro: elemento input não encontrado');
        return;
    }

    try {
        input.addEventListener('change', function() {
            if (this.files === null) {
                window.alert('Erro ao ler arquivo');
                return;
            }

            enviarPrograma(chip8, this.files[0], () => {
                jogoCarregado = true;
            });
        });

        const atualizarFrame = () => {
            if (jogoCarregado) {
                chip8.emularCiclo();
                chip8.renderizar();
            }

            window.requestAnimationFrame(atualizarFrame);
        };
        window.requestAnimationFrame(atualizarFrame);
    }
    catch (e) {
        window.alert(e);
        console.error(e);
    }
}

main();