/**
 * @author Roberto Nazareth Guedes
 */

import Worker from 'worker-loader!./worker';
import { renderizar } from './renderizador';
import RenderizadorCanvas from './renderizadorCanvas';

function enviarPrograma(worker: Worker, arquivo: Blob): void {
    let leitor = new FileReader();
    leitor.onload = function() {
        if (this.result === null || typeof this.result === 'string') {
            throw new Error('Erro ao ler arquivo');
        }

        //chip8.carregarPrograma(new Uint8Array(this.result));
        worker.postMessage({
            mensagem: 'carregar',
            rom: new Uint8Array(this.result),
        });
    };

    if (arquivo instanceof Blob)
        leitor.readAsArrayBuffer(arquivo);
}

function main(): void {
    const worker = new Worker();
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

            enviarPrograma(worker, this.files[0]);
        });
    }
    catch (e) {
        window.alert(e);
        console.error(e);
    }
}

try {
    main();
} catch (e) {
    window.alert(e);
    console.error(e);
}