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
        /*
        worker.postMessage({
            mensagem: 'carregar',
            rom: new Uint8Array(this.result),
        });
        */
    };

    if (arquivo instanceof Blob)
        leitor.readAsArrayBuffer(arquivo);
}

function main(): void {
    const chip8 = new Chip8();

    //const worker = new Worker();
    //worker.postMessage({a: 1});
    const canvas: HTMLCanvasElement|null = document.querySelector('canvas#chip-8');
    if (canvas === null) {
        throw new Error('Erro ao buscar canvas');
    }

    const ctx = canvas.getContext('2d');
    if (ctx === null) {
        throw new Error('Erro ao buscar contexto do canvas');
    }

    const renderizador = new RenderizadorCanvas(ctx);

    /*
    // mensagens da outra thread
    worker.addEventListener("message", (evento: MessageEvent) => {
        if (typeof evento.data.mensagem !== 'string') {
            return;
        }

        switch (evento.data.mensagem) {
            case 'renderizar':
                renderizar(renderizador, evento.data.tela);
                break;
        }
    });
    */

    const input: HTMLInputElement|null = document.querySelector('input#rom-arquivo');
    if (input === null) {
        console.error('Erro: elemento input não encontrado');
        return;
    }

    document.addEventListener("keydown", e => {
        try {
            const tecla = traduzirInput(e.keyCode);
            /*
            worker.postMessage({
                mensagem: 'teclaBaixo',
                tecla: tecla,
            });
            */
            chip8.teclaBaixo(tecla);
        }
        catch(e) {
        }
    });

    document.addEventListener("keyup", e => {
        try {
            const tecla = traduzirInput(e.keyCode);
            /*worker.postMessage({
                mensagem: 'teclaCima',
                tecla: tecla,
            });
            */
           chip8.teclaCima(tecla);
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

    setInterval(() => {
        if (jogoCarregado) {
            chip8.emularCiclo();

            if (chip8.desenharFlag) {
                renderizar(renderizador, chip8.tela);
            }
        }
    }, 0.01);
}

try {
    main();
} catch (e) {
    window.alert(e);
    console.error(e);
}