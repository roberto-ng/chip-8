// renderizadorWebGL.ts
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

import IRenderizador from './renderizador';

/** Usa o WebGL para renderizar a tela */
export default class RenderizadorWebGL implements IRenderizador {
    private _gl: WebGLRenderingContext;
    private _shader: WebGLProgram;
    private _textura: WebGLTexture;
    private _buffers: {
        texCoord: WebGLBuffer;
        posicao: WebGLBuffer;
        indices: WebGLBuffer;
    };
    private _atributos: {
        texCoord: number;
        posicao: number;
    };
    private _uniformes: {
        textura: WebGLUniformLocation
    };

    readonly PIXEL_TAMANHO: number = 8;
    readonly LARGURA: number = 64;
    readonly ALTURA: number = 32;
    
    constructor(gl: WebGLRenderingContext) {
        this._gl = gl;

        // definição do código fonte do shader
        
        // shader de vértice, que irá rodar em todas as vértices
        // que forem renderizadas
        const verticeFonte = `
            #version 100

            precision mediump float;
            
            attribute vec3 a_pos;
            attribute vec2 a_texCoord;
            varying vec2 v_texCoord;

            void main() {
                gl_Position = vec4(a_pos, 1.0);
                v_texCoord = a_texCoord;
            }
        `;

        // shader de pixel, que irá rodar em todos os pixels que
        // forem renderizados
        const pixelFonte = `
            #version 100
            precision mediump float;

            uniform sampler2D u_textura;
            varying vec2 v_texCoord;

            void main() {
                gl_FragColor = texture2D(u_textura, v_texCoord);
            }
        `;

        // compila o shader
        this._shader = this.compilarShader(verticeFonte, pixelFonte);

        // definição dos dados que vão ser usados nos buffers da GPU

        // coordenadas da textura, de 0 à 1
        const texCoords = [
            1.0, 1.0, // cima direita
            1.0, 0.0, // baixo direita
            0.0, 0.0, // baixo esquerda
            0.0, 1.0, // cima esquerda
        ];

        // posição dos vértices do retângulo
        const posicao = [
            1.0,  1.0, 0.0,
            1.0, -1.0, 0.0,
           -1.0, -1.0, 0.0,
           -1.0,  1.0, 0.0,
       ];

       // os indices do retangulo, que é formado por 2 triangulos
        var indices = [
            0, 1, 3, // primeiro triangulo
            1, 2, 3, // segundo triangulo
        ];

        // aqui, alocamos os buffers na GPU
        const texCoordBuf = this._gl.createBuffer();
        const posBuf = this._gl.createBuffer();
        const indicesBuf = this._gl.createBuffer();
        if (texCoordBuf === null || posBuf === null || indicesBuf === null) {
            throw new Error('Erro ao criar buffers');
        }
        this._buffers = {
            texCoord: texCoordBuf,
            posicao: posBuf,
            indices: indicesBuf,
        };
        
        // aqui, atribuimos os dados àos seus referentes buffers da GPU
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._buffers.posicao);
        this._gl.bufferData(
            this._gl.ARRAY_BUFFER, 
            new Float32Array(posicao),
            this._gl.STATIC_DRAW
        );
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._buffers.texCoord);
        this._gl.bufferData(
            this._gl.ARRAY_BUFFER, 
            new Float32Array(texCoords),
            this._gl.STATIC_DRAW
        );
        this._gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._buffers.indices);
        this._gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER, 
            new Uint16Array(indices), 
            gl.STATIC_DRAW
        );
        
        // aqui, buscamos as variaveis atributos e uniformes do shader 
        const u_textura = gl.getUniformLocation(this._shader, 'u_textura');
        if (u_textura === null) { 
            throw new Error('erro ao achar u_textura'); 
        }
        this._uniformes = {
            textura: u_textura,
        };
        this._atributos = {
            posicao: gl.getAttribLocation(this._shader, 'a_pos'),
            texCoord: gl.getAttribLocation(this._shader, 'a_texCoord'),
        };

        // alocar uma textura na GPU
        const textura = this._gl.createTexture();
        if (textura === null) {
            throw new Error('Erro ao criar textura');
        }
        this._textura = textura;

        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        this.limparTela();
    }

    /** Checa se o navegador suporta WebGL */
    static checarSuporte(): boolean {
        try {
             const canvas = document.createElement('canvas'); 
            //@ts-ignore
            return !!window.WebGLRenderingContext &&
               canvas.getContext('webgl') !== null && 
               canvas.getContext('experimental-webgl') !== null;
        } catch(e) {
            return false;
        }
    }

    limparTela(): void {
        this._gl.clearColor(0, 0, 0, 0);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    }
    
    /** Cria e renderiza uma textura baseada no buffer da tela */
    desenharTela(tela: number[][]): void {
        // seleciona o shader
        this._gl.useProgram(this._shader);
        
        // seleciona a textura na GPU
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._textura);
        
        // usa o método 'criarTexturaRGBA' para criar uma textura baseada nos dados da tela,
        // e então passa esses dados para a textura que está alocada na GPU
        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this.LARGURA, this.ALTURA, 
            0, this._gl.RGBA, this._gl.UNSIGNED_BYTE, this.criarTexturaRGBA(tela));

        // preenche parametros sobre como a textura será renderizada
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
        
        // habílita os atributos do shader
        this._gl.enableVertexAttribArray(this._atributos.texCoord);
        this._gl.enableVertexAttribArray(this._atributos.posicao);

        // seleciona e habilita os buffers
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._buffers.texCoord);
        this._gl.vertexAttribPointer(this._atributos.texCoord, 2, this._gl.FLOAT, false, 0, 0);
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._buffers.posicao);
        this._gl.vertexAttribPointer(this._atributos.posicao, 3, this._gl.FLOAT, false, 0, 0);        

        // coloca a textura na posição 0 da GPU
        this._gl.activeTexture(this._gl.TEXTURE0);
        this._gl.uniform1i(this._uniformes.textura, 0);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this._textura);

        this._gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this._gl.clearDepth(1.0);
        this._gl.enable(this._gl.DEPTH_TEST);
        this._gl.depthFunc(this._gl.LEQUAL);

        // renderiza as vértices
        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._buffers.indices);
        this._gl.drawElements(this._gl.TRIANGLES, 6, this._gl.UNSIGNED_SHORT, 0);
    }

    /** Transforma a tela em uma textura RGBA */
    private criarTexturaRGBA(tela: number[][]): Uint8Array {
        let textura: number[] = [];
        for (let y = this.ALTURA-1; y >= 0; --y) {
            for (let x = 0; x < this.LARGURA; ++x) {
                // aqui, decidimos se o pixel vai ser branco ou roxo
                // dependendo do valor no buffer da tela do chip-8
                let cor: number[] = [];
                if (tela[y][x] === 0) {
                    // cor roxa
                    cor = [57, 50, 71, 255];
                } else {
                    // cor branca
                    cor = [255, 255, 255, 255];
                }
        
               for (let valor of cor) {
                   textura.push(valor);
               }
            }
        }

        return new Uint8Array(textura);
    }

    /** Compila o programa que irá rodar na placa de video para renderizar na tela
     * @param verticeFonte O código fonte do shader de vértice, que é o programa que 
     * irá rodar em todas as vértices que forem renderizados
     * @param pixelFonte O código fonte do shader de pixel, que irá rodar em todos os 
     * pixels que forem renderizados
     * @returns O programa compilado
     */
    private compilarShader(verticeFonte: string, pixelFonte: string): WebGLProgram {
        const vertexShader = this._gl.createShader(this._gl.VERTEX_SHADER);
        if (vertexShader === null) {
            throw new Error('Erro ao criar shader');
        }

        this._gl.shaderSource(vertexShader, verticeFonte);
        this._gl.compileShader(vertexShader);

        // checa erros de compilação
        if (!this._gl.getShaderParameter(vertexShader, this._gl.COMPILE_STATUS)) {
            const mensagem = this._gl.getShaderInfoLog(vertexShader);

            if (mensagem !== null) {
                throw new Error(mensagem);
            }
        }

        const pixelShader = this._gl.createShader(this._gl.FRAGMENT_SHADER);
        if (pixelShader === null) {
            throw new Error('Erro ao criar shader');
        }
        
        this._gl.shaderSource(pixelShader, pixelFonte);
        this._gl.compileShader(pixelShader);

        // checa erros de compilação
        if (!this._gl.getShaderParameter(pixelShader, this._gl.COMPILE_STATUS)) {
            const mensagem = this._gl.getShaderInfoLog(pixelShader);

            if (mensagem !== null) {
                throw new Error(mensagem);
            }
        }

        const programa = this._gl.createProgram();
        if (programa === null) {
            throw new Error('Erro ao criar programa');
        }

        this._gl.attachShader(programa, vertexShader);
        this._gl.attachShader(programa, pixelShader);
        this._gl.linkProgram(programa);
      
        // checa erros de linkagem
        if (!this._gl.getProgramParameter(programa, this._gl.LINK_STATUS)) {
            const mensagem = this._gl.getShaderInfoLog(vertexShader);

            if (mensagem !== null) {
                throw new Error(mensagem);
            }
        }

        return programa;
    }
}