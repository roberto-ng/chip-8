/**
 * @author Roberto Nazareth Guedes
 */

import Chip8 from './chip8';
import RenderizadorCanvas from './renderizadorCanvas';
import { renderizar } from './renderizador';
import { traduzirInput } from './input';

let jogoCarregado = false;

function enviarPrograma(chip8: Chip8, arquivo: Blob): void {
    let leitor = new FileReader();
    leitor.onload = function() {
        if (this.result === null || typeof this.result === 'string') {
            throw new Error('Erro ao ler arquivo');
        }

        if (jogoCarregado) {
            chip8.resetar();
        }

        chip8.carregarPrograma(new Uint8Array(this.result));
        jogoCarregado = true;
    };

    if (arquivo instanceof Blob)
        leitor.readAsArrayBuffer(arquivo);
}

function main(): void {
    const chip8 = new Chip8();

    const canvas: HTMLCanvasElement|null = document.querySelector('canvas#chip-8');
    if (canvas === null) {
        throw new Error('Erro ao buscar canvas');
    }

    const ctx = canvas.getContext('2d');
    if (ctx === null) {
        throw new Error('Erro ao buscar contexto do canvas');
    }

    const renderizador = new RenderizadorCanvas(ctx);

    const input: HTMLInputElement|null = document.querySelector('input#rom-arquivo');
    if (input === null) {
        console.error('Erro: elemento input não encontrado');
        return;
    }

    document.addEventListener("keydown", e => {
        try {
            chip8.teclaBaixo(traduzirInput(e.keyCode));
        }
        catch(e) {
        }
    });

    document.addEventListener("keyup", e => {
        try {
           chip8.teclaCima(traduzirInput(e.keyCode));
        }
        catch(e) {
        }
    });

    try {
        input.addEventListener('change', function() {
            if (this.files === null) {
                window.alert('Erro ao ler arquivo');
                return;
            }

            enviarPrograma(chip8, this.files[0]);
        });
    }
    catch (e) {
        window.alert(e);
        console.error(e);
    }
    
    let milissegundos = 2;

    const atualizar = () => {
        if (jogoCarregado) {
            chip8.emularCiclo();

            if (chip8.desenharFlag) {
                renderizar(renderizador, chip8.tela);
            }
        }

        setTimeout(atualizar, milissegundos);
    };
    setTimeout(atualizar, milissegundos);

    Promise.resolve().then(() => atualizar());
}

try {
    main();
} catch (e) {
    window.alert(e);
    console.error(e);
}