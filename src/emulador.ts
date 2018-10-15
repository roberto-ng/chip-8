/**
 * @author Roberto Nazareth Guedes
 */

import 'whatwg-fetch'

import Chip8 from './chip8';
import RenderizadorCanvas from './renderizadorCanvas';
import { decodificarPrograma } from './disassembler';
import { traduzirInput } from './input';
import { renderizar } from './renderizador';

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

/**
* Abstrai as interações da máquina virtual com o HTML
*/
export default class Emulador {
    /** Instancia da máquina virtual */
    private _chip8: Chip8;

    /** Objeto que irá desenhar no canvas */
    private _renderizador: RenderizadorCanvas;

    /** Se há um jogo carregado */
    private _jogoCarregado: boolean;

    /** Verdadeiro se o a última ROM atual tiver sido enviado pelo usuário, 
    * falso se a ROM atual for tiver sido escolhida pelo elemento select
    */
    private _arquivoEnviado: boolean;

    /** Pseudo-código do assembly da ROM atual */
    private _assembly: {[key: number]: string | undefined};

    /** Elemento 'div' que vai conter as instruções em pseudo-assembly */
    private _divInstrucoes: HTMLDivElement;

    /** Elemento 'select' que permite o usuário escolher ROMs */
    private _select: HTMLSelectElement;
    
    /** Botão que reseta o emulador */
    private _resetarBtn: HTMLButtonElement;

    /** Botão que pausa o emulador */
    private _pauseBtn: HTMLButtonElement;

    /** Botão que dá play no emulador */
    private _playBtn: HTMLButtonElement;

    /** Botão que executa apenas uma instrução no emulador pausado */
    private _stepBtn: HTMLButtonElement;

    /** Elemento 'input' que permite que o usuário envie suas próprias ROMs */
    private _input: HTMLInputElement;

    public constructor() {
        this._chip8 = new Chip8();
        this._jogoCarregado = false;
        this._arquivoEnviado = false;
        this._assembly = {};

        
        const divInstrucoes: HTMLDivElement|null = document.querySelector('div#instrucoes');
        if (divInstrucoes !== null) {
            this._divInstrucoes = divInstrucoes;
        } else {
            throw new Error('Div de instruções não encontrado');
        }

        const canvas: HTMLCanvasElement|null = document.querySelector('canvas#chip-8');
        if (canvas === null) {
            throw new Error('Erro ao buscar canvas');
        }
    
        const ctx = canvas.getContext('2d');
        if (ctx === null) {
            throw new Error('Erro ao buscar contexto do canvas');
        }

        this._renderizador = new RenderizadorCanvas(ctx);

        const select: HTMLSelectElement|null = document.querySelector('select#rom-select');
        if (select !== null) {
            this._select = select;
        } else {
            throw new Error('Erro: elemento select não encontrado');
        }
        
        const resetarBtn: HTMLButtonElement|null = document.querySelector('#chip-8-resetar');
        const pauseBtn: HTMLButtonElement|null = document.querySelector('#chip-8-pause');
        const playBtn: HTMLButtonElement|null = document.querySelector('#chip-8-play');
        const stepBtn: HTMLButtonElement|null = document.querySelector('#chip-8-step');

        if (pauseBtn === null || playBtn === null ||
            stepBtn === null || resetarBtn === null) {
            throw new Error('Botões não encontrados');
        } else {
            this._resetarBtn = resetarBtn;
            this._pauseBtn = pauseBtn;
            this._playBtn = playBtn;
            this._stepBtn = stepBtn;
        }

        const input: HTMLInputElement|null = document.querySelector('input#rom-arquivo');
        if (input !== null) {
            this._input = input;
        } else {
            throw new Error('Erro: elemento input não encontrado');
        }

        this.registrarEventos();
    }

    /**
    * Carrega um arquivo na máquina virtual
    * @param arquivo O arquivo
    */
    public enviarPrograma(arquivo: Blob): void {
        /** 
         * Usado para não entrar em conflito com 
         * o 'this' da função callback do FileReader
         */
        let self = this;
        let leitor = new FileReader();

        leitor.onload = function() {
            if (this.result === null || typeof this.result === 'string') {
                throw new Error('Erro ao ler arquivo');
            }
    
            if (self._jogoCarregado) {
                self._chip8.resetar();
            }
    
            const programa = new Uint8Array(this.result);
            self._chip8.carregarPrograma(programa);
    
            self._assembly = decodificarPrograma(self._chip8.memoria);
            self._jogoCarregado = true;
        };
    
        if (arquivo instanceof Blob) {
            leitor.readAsArrayBuffer(arquivo);
        }
    }

    /** 
     * Adiciona elementos 'p' com pseudo-assembly dos opcodes 
     * próximos ao elemento atual 
     */
    private renderizarAssembly(): void {
        let instrucoes: string[] = [];
        let inicio = this._chip8.pc - 6;
    
        for (let i = 0; i < 12; ++i) {
            const endereco = (i + inicio);
            const enderHex = endereco.toString(16).toUpperCase();
            let instrucao = this._assembly[endereco];
    
            // só mostrar a instrução caso tanto o pc quanto 
            // o endereço forem pares ou forem impares
            if ( (par(this._chip8.pc) &&  par(endereco)) ||
                (!par(this._chip8.pc) && !par(endereco))) {
                if (typeof instrucao === 'string') {
                    if (endereco === this._chip8.pc) {
                        instrucoes.push(`->  0x${enderHex}: ${instrucao}`);
                    }
                    else {
                        instrucoes.push(`0x${enderHex}: ${instrucao}`);
                    }
                }
            }
        }
    
        removerFilhos(this._divInstrucoes);
    
        for (let instrucao of instrucoes) {
            let p = document.createElement('p');
            p.innerHTML = instrucao;
            p.classList.add('instrucao');
    
            if (instrucao.startsWith('->')) {
                p.classList.add('atual');
            }
    
            this._divInstrucoes.appendChild(p);
        }
    }

    /** Registra os eventos aos elementos */
    private registrarEventos(): void {
        this._select.onchange = e => this.eventoCarregarROMSelect();
        this._resetarBtn.onclick = e => this.eventoResetarBtn(e);
        this._pauseBtn.onclick = e => this.eventoPauseBtn(e);
        this._playBtn.onclick = e => this.eventoPlayBtn(e);
        this._stepBtn.onclick = e => this.eventoStepBtn(e);

        // busca um array com os botões do teclado virtual
        const tecladoBotoes = document.querySelectorAll('div#teclado-virtual .teclado-btn');
        if (tecladoBotoes === null) {
            throw new Error('Botões não encontrados');
        }

        tecladoBotoes.forEach(teclaBtn => {
            if (teclaBtn instanceof HTMLButtonElement) {
                // transforma o valor HEX do botão em um número
                const tecla = parseInt(teclaBtn.innerHTML, 16);
                if (isNaN(tecla)) { return; }
    
                // evento que registra que o usuário pressionou uma tecla
                teclaBtn.onmousedown = e => this._chip8.teclaBaixo(tecla);
                teclaBtn.ontouchstart = e => this._chip8.teclaBaixo(tecla);

                // eveto que registra que o usuário soltou uma tecla
                teclaBtn.onmouseup = e => this._chip8.teclaCima(tecla);
                teclaBtn.ontouchend = e => this._chip8.teclaCima(tecla);
            }
        });
        document.addEventListener('keydown', e => {
            try {
                this._chip8.teclaBaixo(traduzirInput(e.keyCode));
            }
            catch(e) {
            }
        });
    
        document.addEventListener('keyup', e => {
            try {
                this._chip8.teclaCima(traduzirInput(e.keyCode));
            }
            catch(e) {
            }
        });

        const self = this;
        this._input.addEventListener('change', function() {
            if (this.files === null) {
                window.alert('Erro ao ler arquivo');
                return;
            }

            self.enviarPrograma(this.files[0]);
            self._pauseBtn.disabled = false;
            self._playBtn.disabled = true;
            self._stepBtn.disabled = true;
            self._arquivoEnviado = true;
        });
    }

    private async eventoCarregarROMSelect(): Promise<void> {
        let romNome = this._select.options[this._select.selectedIndex].value;
        if (typeof romNome !== 'string') {
            return;
        }

        try {
            const resposta = await fetch(`roms/${romNome}`);
            const arquivo = await resposta.blob();
        
            this.enviarPrograma(arquivo);
        
            this._pauseBtn.disabled = false;
            this._playBtn.disabled = true;
            this._stepBtn.disabled = true; 
            this._select.blur();
            this._arquivoEnviado = false;
            this._jogoCarregado = true;
        }
        catch (e) {
            console.error(e);
        }
    }

    /** Inicia a máquina virtual */
    public iniciarLoop() {    
        // executar 10 insturções por frame
        const execPorFrame = 10;

        const atualizar = () => {
            if (this._jogoCarregado) {
                for (let i = 0; i < execPorFrame; ++i) {
                    this.renderizarAssembly();
                    this._chip8.emularCiclo();
        
                    if (this._chip8.desenharFlag) {
                        renderizar(this._renderizador, this._chip8.tela);
                    }
                }
            }
    
            window.requestAnimationFrame(atualizar);
        };
        window.requestAnimationFrame(atualizar);

        this.eventoCarregarROMSelect();
    }

    private eventoResetarBtn(e: MouseEvent): void {
        this._chip8.resetar();

        // checa se é necessário reenviar a ROM no input
        if (this._arquivoEnviado) {
            if (this._input.files    !== null &&
                this._input.files[0] !== null) {
                this.enviarPrograma(this._input.files[0]);
            }
        } else {
            this.eventoCarregarROMSelect();
        }

        this._pauseBtn.disabled = false;
        this._playBtn.disabled = true;
        this._stepBtn.disabled = true;
    }

    private eventoPauseBtn(e: MouseEvent): void {
        this._chip8.pausar();

        this._pauseBtn.disabled = true;
        this._playBtn.disabled = false;
        this._stepBtn.disabled = false;
    }

    private eventoPlayBtn(e: MouseEvent): void {
        this._chip8.play();

        this._pauseBtn.disabled = false;
        this._playBtn.disabled = true;
        this._stepBtn.disabled = true;
    }

    private eventoStepBtn(e: MouseEvent): void {
        this._chip8.step();
    }

    get jogoCarregando(): boolean {
        return this._jogoCarregado;
    }

    get arquivoEnviado(): boolean {
        return this._arquivoEnviado;
    }

    get assembly(): {[key: number]: string|undefined} {
        return this._assembly;
    }
}