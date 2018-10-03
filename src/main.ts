/**
 * @author Roberto Nazareth Guedes
 */

import Chip8 from './chip8';
import RenderizadorCanvas from './renderizadorCanvas';
import { renderizar } from './renderizador';
import { traduzirInput } from './input';
import { decodificarPrograma } from './disassembler';

let jogoCarregado = false;
let assembly: {[key: number]: string|undefined} = {};

/**
 * Carrega o arquivo no emulador
 * @param chip8 Instancia da máquina virtual em que o arquivo será carregado
 * @param arquivo O arquivo a ser carregado
 */
function enviarPrograma(chip8: Chip8, arquivo: Blob): void {
    let leitor = new FileReader();
    leitor.onload = function() {
        if (this.result === null || typeof this.result === 'string') {
            throw new Error('Erro ao ler arquivo');
        }

        if (jogoCarregado) {
            chip8.resetar();
        }

        const programa = new Uint8Array(this.result);
        chip8.carregarPrograma(programa);

        assembly = decodificarPrograma(chip8.memoria);
        jogoCarregado = true;
    };

    if (arquivo instanceof Blob)
        leitor.readAsArrayBuffer(arquivo);
}

/** 
 * Remove os elementos filhos de um div 
 * @param div O div a ter os elementos filhos removidos
 */
function removerFilhos(div: HTMLDivElement) {
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
}

function renderizarAssembly(chip8: Chip8, div_pai: HTMLDivElement) {
    let instrucoes: string[] = [];
    let inicio = chip8.pc - 8;

    for (let i = 0; i < 20; ++i) {
        const endereco = i + inicio;
        const enderHex = endereco.toString(16).toUpperCase();
        let instrucao = assembly[endereco];

        if (typeof instrucao === 'string') {
            if (endereco+2 === chip8.pc) {
                instrucoes.push(`->  0x${enderHex}: ${instrucao}`);
            }
            else {
                instrucoes.push(`0x${enderHex}: ${instrucao}`);
            }
        }
    }

    removerFilhos(div_pai);

    for (let instrucao of instrucoes) {
        let p = document.createElement('p');
        p.innerHTML = instrucao;
        p.classList.add('instrucao');

        if (instrucao.startsWith('->')) {
            p.classList.add('atual');
        }

        div_pai.appendChild(p);
    }
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

    const divInstrucoes = document.querySelector('div#instrucoes');
    if (!(divInstrucoes instanceof HTMLDivElement)) {
        console.error('Erro: div de instruções não encontrado');
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

            renderizarAssembly(chip8, divInstrucoes);
        }

        setTimeout(atualizar, milissegundos);
    };
    setTimeout(atualizar, milissegundos);

    Promise.resolve().then(() => atualizar());
    Promise.resolve().then(() => atualizar());
}

try {
    main();
} catch (e) {
    window.alert(e);
    console.error(e);
}