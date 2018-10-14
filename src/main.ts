/**
 * @author Roberto Nazareth Guedes
 */
import 'whatwg-fetch'

import Chip8 from './chip8';
import RenderizadorCanvas from './renderizadorCanvas';
import { renderizar } from './renderizador';
import { traduzirInput } from './input';
import { decodificarPrograma } from './disassembler';

let jogoCarregado = false;
let arquivoEnviado = false;
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
function removerFilhos(div: HTMLDivElement): void {
    while (div.firstChild) {
        div.removeChild(div.firstChild);
    }
}

/** Checa se o número é par */
function par(num: number): boolean {
    return num % 2 === 0;
}

function renderizarAssembly(chip8: Chip8, div_pai: HTMLDivElement): void {
    let instrucoes: string[] = [];
    let inicio = chip8.pc - 6;

    for (let i = 0; i < 12; ++i) {
        const endereco = (i + inicio);
        const enderHex = endereco.toString(16).toUpperCase();
        let instrucao = assembly[endereco];

        // só mostrar a instrução caso tanto o pc quanto 
        // o endereço forem pares ou forem impares
        if ( (par(chip8.pc) &&  par(endereco)) ||
            (!par(chip8.pc) && !par(endereco))) {
            if (typeof instrucao === 'string') {
                if (endereco === chip8.pc) {
                    instrucoes.push(`->  0x${enderHex}: ${instrucao}`);
                }
                else {
                    instrucoes.push(`0x${enderHex}: ${instrucao}`);
                }
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

    const select: HTMLSelectElement|null = document.querySelector('select#rom-select');
    if (select === null) {
        console.error('Erro: elemento select não encontrado');
        return;
    }

    const divInstrucoes = document.querySelector('div#instrucoes');
    if (!(divInstrucoes instanceof HTMLDivElement)) {
        console.error('Erro: div de instruções não encontrado');
        return;
    }

    const resetarBtn: HTMLButtonElement|null = document.querySelector('#chip-8-resetar');
    const pauseBtn: HTMLButtonElement|null = document.querySelector('#chip-8-pause');
    const playBtn: HTMLButtonElement|null = document.querySelector('#chip-8-play');
    const stepBtn: HTMLButtonElement|null = document.querySelector('#chip-8-step');
    const tecladoBotoes = document.querySelectorAll('div#teclado-virtual .teclado-btn');

    if (pauseBtn === null || playBtn === null ||
        stepBtn === null || resetarBtn === null ||
        tecladoBotoes === null) {
        throw new Error('Botões não encontrados');
    }

    tecladoBotoes.forEach(teclaBtn => {
        if (teclaBtn instanceof HTMLButtonElement) {
            // transforma o valor HEX do botão em um número
            const tecla = parseInt(teclaBtn.innerHTML, 16);
            if (isNaN(tecla)) { return; }

            // evento que registra que o usuário pressionou uma tecla
            teclaBtn.onmousedown = e => chip8.teclaBaixo(tecla);
            // eveto que registra que o usuário soltou uma tecla
            teclaBtn.onmouseup = e => chip8.teclaCima(tecla);
        }
    });

    /** Carrega a rom descrita no elemento select */
    const carregarRomSelect = async () => {
        let romNome = select.options[select.selectedIndex].value;
        if (typeof romNome !== 'string') {
            return;
        }

        try {
            const resposta = await fetch(`roms/${romNome}`);
            const arquivo = await resposta.blob();
         
            enviarPrograma(chip8, arquivo);
         
            pauseBtn.disabled = false;
            playBtn.disabled = true;
            stepBtn.disabled = true; 
            arquivoEnviado = false;
            select.blur();
        }
        catch (e) {
            console.error(e);
        }
    };

    // reseta a maquina virtual quando o botão
    // for pressionado
    resetarBtn.onclick = e => {
        chip8.resetar();

        // enviar programa haja um arquivo no input,
        // recarregar ele

        if (arquivoEnviado) {
            if (input.files !== null && input.files[0] !== null) {
                enviarPrograma(chip8, input.files[0]);
            }
        } else {
            carregarRomSelect();
        }

        pauseBtn.disabled = false;
        playBtn.disabled = true;
        stepBtn.disabled = true;
    };

    pauseBtn.onclick = e => {
        chip8.pausar();

        pauseBtn.disabled = true;
        playBtn.disabled = false;
        stepBtn.disabled = false;
    };

    playBtn.onclick = e => {
        chip8.play();

        pauseBtn.disabled = false;
        playBtn.disabled = true;
        stepBtn.disabled = true;
    };

    stepBtn.onclick = e => {
        chip8.step();
    };

    document.addEventListener('keydown', e => {
        try {
            chip8.teclaBaixo(traduzirInput(e.keyCode));
        }
        catch(e) {
        }
    });

    document.addEventListener('keyup', e => {
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
            pauseBtn.disabled = false;
            playBtn.disabled = true;
            stepBtn.disabled = true;
            arquivoEnviado = true;
        });
    }
    catch (e) {
        window.alert(e);
        console.error(e);
    }

    select.onchange = e => carregarRomSelect();
    
    let milissegundos = 2;

    const atualizar = () => {
        if (jogoCarregado) {
            renderizarAssembly(chip8, divInstrucoes);
            chip8.emularCiclo();

            if (chip8.desenharFlag) {
                renderizar(renderizador, chip8.tela);
            }
        }

        setTimeout(atualizar, milissegundos);
    };
    setTimeout(atualizar, milissegundos);

    Promise.resolve().then(() => atualizar());
    Promise.resolve().then(() => atualizar());

    carregarRomSelect();
}

try {
    main();
} catch (e) {
    window.alert(e);
    console.error(e);
}