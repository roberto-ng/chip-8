/**
 * @fileoverview Define uma implementação da interface 
 * IRenderizador, que renderiza usando WebGL
 * @author Roberto Nazareth Guedes
 */

import IRenderizador from './renderizador';

export default class RenderizadorWebGL implements IRenderizador {
    private _gl: WebGLRenderingContext;
    private _largura: number;
    private _altura: number;
    private _programa: WebGLProgram;
    private _u_corLocal: WebGLUniformLocation;
    private _u_resolucao: WebGLUniformLocation;
    private _a_posicao: GLint;

    public readonly PIXEL_TAMANHO: number = 8;
    
    public constructor(gl: WebGLRenderingContext) {
        this._gl = gl;
        this._largura = this.PIXEL_TAMANHO * 64;
        this._altura = this.PIXEL_TAMANHO * 32;
        this._programa = this.compilarPrograma();

        this._gl.useProgram(this._programa);

        const u_corLocal = this._gl.getUniformLocation(this._programa, 'u_cor');
        if (u_corLocal === null) {
            throw new Error('Erro ao buscar uniforme');
        }
        this._u_corLocal = u_corLocal;

        const u_resolucao = this._gl.getUniformLocation(this._programa, 'u_resolucao');
        if (u_resolucao === null) {
            throw new Error('Erro ao buscar uniforme');
        }
        this._u_resolucao = u_resolucao;
        gl.uniform2f(this._u_resolucao, gl.canvas.width, gl.canvas.height);

        this._a_posicao = this._gl.getAttribLocation(this._programa, 'a_posicao');
        this._gl.enableVertexAttribArray(this._a_posicao);

        gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        const bufferPosicao = this._gl.createBuffer();
        if (bufferPosicao === null) {
            throw new Error('Erro ao criar buffer');
        }
        this._gl.bindBuffer(gl.ARRAY_BUFFER, bufferPosicao);
        this._gl.vertexAttribPointer(this._a_posicao, 2, gl.FLOAT, false, 0, 0);
    }

    public mudarCor(r: number, g: number, b: number): void {
        this._gl.uniform4fv(this._u_corLocal, [r/255.0, g/255.0, b/255.0, 1.0]);
    }

    public limparTela(): void {
        this._gl.clearColor(0, 0, 0, 0);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    }

    public desenharQuadrado(x: number, y: number, l: number, a: number): void {
        const x1 = x;
        const x2 = x + this._largura;
        const y1 = y;
        const y2 = y + this._altura;
      
        const verticies = new Float32Array([
            x1, y1,
            x2, y1,
            x1, y2,
            x1, y2,
            x2, y1,
            x2, y2,
        ]);
      
        this._gl.bufferData(this._gl.ARRAY_BUFFER, verticies, this._gl.DYNAMIC_DRAW);
        this._gl.drawArrays(this._gl.TRIANGLES, 0, 6);
    }

    public encerrarFrame(): void {
    }

    /** Compila o programa que irá rodar na placa de video e que
     * será usado para desenhar os quadrados
     * @returns O programa já compilado
     */
    private compilarPrograma(): WebGLProgram {
        const vertexShaderSource = `
        attribute vec2 a_posicao;
        uniform vec2 u_resolucao;
        
        void main() {
           // converte os pixels para um número entre 0.0 e 1.0
           vec2 zeroParaUm = a_posicao / u_resolucao;
           // converte de 0->1 para 0->2
           vec2 zeroParaDois = zeroParaUm * 2.0;
           // converte de 0->2 para -1->+1 (clipspace)
           vec2 clipSpace = zeroParaDois - 1.0;
        
           gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
        }
        `;
        
        const fragmentShaderSource = `
        #ifdef GL_ES
        precision highp float;
        #endif
        
        uniform vec4 u_cor;
        
        void main() {
          gl_FragColor = u_cor;
        }
        `;
        
        const vertexShader = this._gl.createShader(this._gl.VERTEX_SHADER);
        if (vertexShader === null) {
            throw new Error('Erro ao criar shader');
        }

        this._gl.shaderSource(vertexShader, vertexShaderSource);
        this._gl.compileShader(vertexShader);

        // checa erros de compilação
        if (!this._gl.getShaderParameter(vertexShader, this._gl.COMPILE_STATUS)) {
            const mensagem = this._gl.getShaderInfoLog(vertexShader);

            if (mensagem !== null) {
                throw new Error(mensagem);
            }
        }

        const fragmentShader = this._gl.createShader(this._gl.FRAGMENT_SHADER);
        if (fragmentShader === null) {
            throw new Error('Erro ao criar shader');
        }
        
        this._gl.shaderSource(fragmentShader, fragmentShaderSource);
        this._gl.compileShader(fragmentShader);

        // checa erros de compilação
        if (!this._gl.getShaderParameter(fragmentShader, this._gl.COMPILE_STATUS)) {
            const mensagem = this._gl.getShaderInfoLog(fragmentShader);

            if (mensagem !== null) {
                throw new Error(mensagem);
            }
        }

        const programa = this._gl.createProgram();
        if (programa === null) {
            throw new Error('Erro ao criar programa');
        }

        this._gl.attachShader(programa, vertexShader);
        this._gl.attachShader(programa, fragmentShader);
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