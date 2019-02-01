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
    private _shader: WebGLProgram;
    private _texCoords: number[];
    private _coordBuffer: WebGLBuffer;
    private _posicaoBuffer: WebGLBuffer;
    private _indicesBuffer: WebGLBuffer;
    private u_sampler: WebGLUniformLocation;
    private a_textCoord: number;
    private a_posicao;
    private textura: WebGLTexture;

    public readonly PIXEL_TAMANHO: number = 8;
    
    public constructor(gl: WebGLRenderingContext) {
        console.log('usando webgl');
        this._gl = gl;
        this._largura = this.PIXEL_TAMANHO * 64;
        this._altura = this.PIXEL_TAMANHO * 32;
        //this._cor = new Array(4);
        this._shader = this.compilarShaderUsarTextura();

        this._texCoords = [
            1.0, 1.0, // cima direita
            1.0, 0.0, // baixo direita
            0.0, 0.0, // baixo esquerda
            0.0, 1.0, // cima esquerda
        ];

        const posicao = [
            1.0,  1.0, 0.0,
            1.0, -1.0, 0.0,
           -1.0, -1.0, 0.0,
           -1.0,  1.0, 0.0,
       ];

        var indices = [
            0, 1, 3, // primeiro triangulo
            1, 2, 3, // segundo triangulo
        ];

        const textureCoordBuffer = this._gl.createBuffer();
        if (textureCoordBuffer === null) {
            throw new Error('Erro ao criar textureCoordBuffer');
        }
        this._coordBuffer = textureCoordBuffer;

        const posicaoBuffer = this._gl.createBuffer();
        if (posicaoBuffer === null) {
            throw new Error('Erro ao criar posicaoBuffer');
        }
        this._posicaoBuffer = posicaoBuffer;

        const indicesBuffer = this._gl.createBuffer();
        if (indicesBuffer === null) {
            throw new Error('Erro ao criar indicesBuffer');
        }
        this._indicesBuffer = indicesBuffer;
        
        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._posicaoBuffer);
        this._gl.bufferData(
            this._gl.ARRAY_BUFFER, 
            new Float32Array(posicao),
            this._gl.STATIC_DRAW
        );

        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._coordBuffer);
        this._gl.bufferData(
            this._gl.ARRAY_BUFFER, 
            new Float32Array(this._texCoords),
            this._gl.STATIC_DRAW
        );

        this._gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        this._gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER, 
            new Uint16Array(indices), 
            gl.STATIC_DRAW
        );

        this.a_textCoord = gl.getAttribLocation(this._shader, 'a_tex_coord');
        this.a_posicao = gl.getAttribLocation(this._shader, 'a_pos');
        
        const u_sampler = gl.getUniformLocation(this._shader, 'u_sampler');
        if (u_sampler === null) { throw new Error('erro ao achar u_sampler'); }
        this.u_sampler = u_sampler;

        const textura = this._gl.createTexture();
        if (textura === null) {
            throw new Error('Erro ao criar textura');
        }
        this.textura = textura;

        this._gl.viewport(0, 0, this._gl.canvas.width, this._gl.canvas.height);
        this.limparTela();
    }

    public static checarSuporte(): boolean {
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

    public mudarCor(r: number, g: number, b: number): void {
        //this._cor = [r/255.0, g/255.0, b/255.0, 1.0];
        //this._gl.uniform4fv(this._u_corLocal, [r/255.0, g/255.0, b/255.0, 1.0]);
    }

    public limparTela(): void {
        this._gl.clearColor(0, 0, 0, 0);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    }

    public desenharQuadrado(x: number, y: number, l: number, a: number): void {
    }
    
    public encerrarFrame(): void {
    }

    public desenharTela(tela: number[][]): void {
        this._gl.useProgram(this._shader);
        
        this._gl.bindTexture(this._gl.TEXTURE_2D, this.textura);
        
        //this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1);
        this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, 64, 32, 
            0, this._gl.RGBA, this._gl.UNSIGNED_BYTE, this.criarTextura(tela));

        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.NEAREST);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
        this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
        
        this._gl.enableVertexAttribArray(this.a_textCoord);
        this._gl.enableVertexAttribArray(this.a_posicao);

        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._coordBuffer);
        this._gl.vertexAttribPointer(this.a_textCoord, 2, this._gl.FLOAT, false, 0, 0);

        this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._posicaoBuffer);
        this._gl.vertexAttribPointer(this.a_posicao, 3, this._gl.FLOAT, false, 0, 0);        

        this._gl.activeTexture(this._gl.TEXTURE0);
        this._gl.uniform1i(this.u_sampler, 0);
        this._gl.bindTexture(this._gl.TEXTURE_2D, this.textura);

        this._gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this._gl.clearDepth(1.0);
        this._gl.enable(this._gl.DEPTH_TEST);
        this._gl.depthFunc(this._gl.LEQUAL);

        // limpa o canvas
        //this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);

        this._gl.bindBuffer(this._gl.ELEMENT_ARRAY_BUFFER, this._indicesBuffer);
        this._gl.drawElements(this._gl.TRIANGLES, 6, this._gl.UNSIGNED_SHORT, 0);
    }

    private criarTextura(tela: number[][]): Uint8Array {
        let textura: number[] = [];
        let pixels: number[][] = [];

        let count = 0;
        for (let y = 31; y >= 0; --y) {
            for (let x = 0; x < 64; ++x) {
                // cor branca
                let cor = [255, 255, 255, 255];
                const pixel = tela[y][x];
                if (pixel === 0) {
                    cor = [57, 50, 71, 255];
                }
        
               pixels.push(cor);
            }
        }

        for (let pixel of pixels) {
            for (let valor of pixel) {
                textura.push(valor);
            }
        }

        return new Uint8Array(textura);
    }

    private compilarShaderUsarTextura(): WebGLProgram {
        const v_source = `
            precision highp float;
            
            attribute vec3 a_pos;
            attribute vec2 a_tex_coord;
            varying vec2 v_tex_coord;

            void main() {
                gl_Position = vec4(a_pos, 1.0);
                v_tex_coord = a_tex_coord;
            }
        `;

        const f_source = `
            precision highp float;

            uniform sampler2D u_sampler;
            varying vec2 v_tex_coord;

            void main() {
                gl_FragColor = texture2D(u_sampler, v_tex_coord);
            }
        `;

        return this.compilarPrograma(v_source, f_source);
    }

    /** Compila o programa que irá rodar na placa de video e que
     * será usado para desenhar os quadrados
     * @returns O programa já compilado
     */
    private compilarPrograma(vSource: string, fSource: string): WebGLProgram {
        const vertexShader = this._gl.createShader(this._gl.VERTEX_SHADER);
        if (vertexShader === null) {
            throw new Error('Erro ao criar shader');
        }

        this._gl.shaderSource(vertexShader, vSource);
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
        
        this._gl.shaderSource(fragmentShader, fSource);
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