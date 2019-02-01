// ui.ts
//
// Copyright 2019 Roberto Nazareth <nazarethroberto97@gmail.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// SPDX-License-Identifier: GPL-3.0-or-later

import 'whatwg-fetch';

import Chip8 from './chip8';
import RenderizadorCanvas from './renderizadorCanvas';
import RenderizadorWebGL from './renderizadorWebGL';
import { decodificarPrograma } from './disassembler';
import { traduzirInput } from './input';
import IRenderizador from './renderizador';

/** Checa se o número é par */
function par(num: number): boolean {
    return num % 2 === 0;
}

/**
* Abstrai as interações da máquina virtual com o HTML
*/
export default class UI {
    /** Instancia da máquina virtual */
    private _chip8: Chip8;

    /** Se há um jogo carregado */
    private _jogoCarregado: boolean;

    /** Verdadeiro se o a última ROM atual tiver sido enviado pelo usuário, 
    * falso se a ROM atual for tiver sido escolhida pelo elemento select
    */
    private _arquivoEnviado: boolean;

    /** Pseudo-código do assembly da ROM atual */
    private _assembly: {[key: number]: string | undefined};

    /** Elemento 'div' que vai conter as instruções em pseudo-assembly */
    private divInstrucoes: HTMLDivElement;

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

    /** Dobra a quantidade de instruções executadas por frame */
    private _dobrarVelocidade: boolean;

    private _renderizador: IRenderizador;

    constructor() {
        this._jogoCarregado = false;
        this._arquivoEnviado = false;
        this._dobrarVelocidade = false;
        this._assembly = {};
        
        const divInstrucoes: HTMLDivElement|null = document.querySelector('div#instrucoes');
        if (divInstrucoes !== null) {
            this.divInstrucoes = divInstrucoes;
        } else {
            throw new Error('Div de instruções não encontrado');
        }

        const canvas: HTMLCanvasElement|null = document.querySelector('canvas#chip-8');
        if (canvas === null) {
            throw new Error('Erro ao buscar canvas');
        }
    
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

        if (RenderizadorWebGL.checarSuporte()) {
            console.log('usando webgl');
            const ctx = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            if (ctx === null) {
                throw new Error('Erro ao buscar contexto do canvas');
            }

            this._renderizador = new RenderizadorWebGL(ctx);
            this._chip8 = new Chip8(this._renderizador);
        } else {
            console.log('usando canvas2d');
            const ctx = canvas.getContext('2d');
            if (ctx === null) {
                throw new Error('Erro ao buscar contexto do canvas');
            }

            this._renderizador = new RenderizadorCanvas(ctx);
            this._chip8 = new Chip8(this._renderizador);
        }

        this.registrarEventos();
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

    /**
    * Carrega um arquivo na máquina virtual
    * @param arquivo O arquivo
    */
    enviarPrograma(arquivo: Blob): void {
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
     * Remove os elementos filhos de um div 
     * @param div O div a ter os elementos filhos removidos
     */
    removerFilhos(div: HTMLDivElement): void {
        while (div.firstChild) {
            div.removeChild(div.firstChild);
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
    
        this.removerFilhos(this.divInstrucoes);
    
        for (let instrucao of instrucoes) {
            let p = document.createElement('p');
            p.innerHTML = instrucao;
            p.classList.add('instrucao');
    
            if (instrucao.startsWith('->')) {
                p.classList.add('atual');
            }
    
            this.divInstrucoes.appendChild(p);
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
                teclaBtn.onmouseleave = e => this._chip8.teclaCima(tecla);
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

            self._chip8.resetar();
            self.enviarPrograma(this.files[0]);
            
            self._dobrarVelocidade = false;
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

        // dobrar velocidade se a rom for do jogo BLINKY
        if (romNome === 'BLINKY') {
            this._dobrarVelocidade = true;
        } else {
            this._dobrarVelocidade = false;
        }

        try {
            const resposta = await fetch(`roms/${romNome}`);
            const arquivo = await resposta.blob();
        
            this._chip8.resetar();
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
    iniciarLoop() {    
        // executar 10 insturções por frame
        const execPorFrame = 10;

        const atualizar = () => {
            if (this._jogoCarregado) {
                let qtd = execPorFrame;
                
                // dobra a velocidade se necessário
                if (this._dobrarVelocidade) {
                    qtd = execPorFrame * 2;
                }

                for (let i = 0; i < qtd; ++i) {
                    this.renderizarAssembly();
                    this._chip8.emularCiclo();
                }

                this._renderizador.desenharTela(this._chip8.tela);
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
}