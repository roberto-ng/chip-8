/**
 * @fileoverview Define uma implementação da interface 
 * IRenderizador, que renderiza usando WebGL
 * @author Roberto Nazareth Guedes
 */

import IRenderizador from './renderizador';

export default class RenderizadorWebGL implements IRenderizador {
    private gl: WebGLRenderingContext;
    private shader: WebGLProgram;
    private tex_coords: number[];
    private coord_buffer: WebGLBuffer;
    private pos_buffer: WebGLBuffer;
    private indices_buffer: WebGLBuffer;
    private u_textura: WebGLUniformLocation;
    private a_tex_coord: number;
    private a_posicao;
    private textura: WebGLTexture;

    public readonly PIXEL_TAMANHO: number = 8;
    public readonly LARGURA: number = 64;
    public readonly ALTURA: number = 32;
    
    public constructor(gl: WebGLRenderingContext) {
        this.gl = gl;

        const v_source = `
            precision mediump float;
            
            attribute vec3 a_pos;
            attribute vec2 a_tex_coord;
            varying vec2 v_tex_coord;

            void main() {
                gl_Position = vec4(a_pos, 1.0);
                v_tex_coord = a_tex_coord;
            }
        `;

        const f_source = `
            precision mediump float;

            uniform sampler2D u_textura;
            varying vec2 v_tex_coord;

            void main() {
                gl_FragColor = texture2D(u_textura, v_tex_coord);
            }
        `;

        this.shader = this.compilarShader(v_source, f_source);

        this.tex_coords = [
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

        const textureCoordBuffer = this.gl.createBuffer();
        if (textureCoordBuffer === null) {
            throw new Error('Erro ao criar textureCoordBuffer');
        }
        this.coord_buffer = textureCoordBuffer;

        const posicaoBuffer = this.gl.createBuffer();
        if (posicaoBuffer === null) {
            throw new Error('Erro ao criar posicaoBuffer');
        }
        this.pos_buffer = posicaoBuffer;

        const indicesBuffer = this.gl.createBuffer();
        if (indicesBuffer === null) {
            throw new Error('Erro ao criar indicesBuffer');
        }
        this.indices_buffer = indicesBuffer;
        
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pos_buffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER, 
            new Float32Array(posicao),
            this.gl.STATIC_DRAW
        );

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.coord_buffer);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER, 
            new Float32Array(this.tex_coords),
            this.gl.STATIC_DRAW
        );

        this.gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);
        this.gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER, 
            new Uint16Array(indices), 
            gl.STATIC_DRAW
        );

        this.a_tex_coord = gl.getAttribLocation(this.shader, 'a_tex_coord');
        this.a_posicao = gl.getAttribLocation(this.shader, 'a_pos');
        
        const u_textura = gl.getUniformLocation(this.shader, 'u_textura');
        if (u_textura === null) { throw new Error('erro ao achar u_textura'); }
        this.u_textura = u_textura;

        const textura = this.gl.createTexture();
        if (textura === null) {
            throw new Error('Erro ao criar textura');
        }
        this.textura = textura;

        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
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
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    public desenharQuadrado(x: number, y: number, l: number, a: number): void {
    }
    
    public encerrarFrame(): void {
    }

    /** Cria e renderiza uma textura baseada no buffer da tela */
    public desenharTela(tela: number[][]): void {
        this.gl.useProgram(this.shader);
        
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textura);
        
        //this._gl.pixelStorei(this._gl.UNPACK_ALIGNMENT, 1);
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.LARGURA, this.ALTURA, 
            0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.criarTexturaRGBA(tela));

        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        
        this.gl.enableVertexAttribArray(this.a_tex_coord);
        this.gl.enableVertexAttribArray(this.a_posicao);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.coord_buffer);
        this.gl.vertexAttribPointer(this.a_tex_coord, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.pos_buffer);
        this.gl.vertexAttribPointer(this.a_posicao, 3, this.gl.FLOAT, false, 0, 0);        

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.uniform1i(this.u_textura, 0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textura);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.indices_buffer);
        this.gl.drawElements(this.gl.TRIANGLES, 6, this.gl.UNSIGNED_SHORT, 0);
    }

    /** Transforma a tela em uma textura RGBA */
    private criarTexturaRGBA(tela: number[][]): Uint8Array {
        let textura: number[] = [];
        for (let y = this.ALTURA-1; y >= 0; --y) {
            for (let x = 0; x < this.LARGURA; ++x) {
                const pixel = tela[y][x];

                // cor branca
                let cor = [255, 255, 255, 255];
                if (pixel === 0) {
                    // cor roxa
                    cor = [57, 50, 71, 255];
                }
        
               for (let valor of cor) {
                   textura.push(valor);
               }
            }
        }

        return new Uint8Array(textura);
    }

    /** Compila o programa que irá rodar na placa de video para desenhar a textura do buffer da tela
     * @returns O programa compilado
     */
    private compilarShader(vSource: string, fSource: string): WebGLProgram {
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
        if (vertexShader === null) {
            throw new Error('Erro ao criar shader');
        }

        this.gl.shaderSource(vertexShader, vSource);
        this.gl.compileShader(vertexShader);

        // checa erros de compilação
        if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
            const mensagem = this.gl.getShaderInfoLog(vertexShader);

            if (mensagem !== null) {
                throw new Error(mensagem);
            }
        }

        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
        if (fragmentShader === null) {
            throw new Error('Erro ao criar shader');
        }
        
        this.gl.shaderSource(fragmentShader, fSource);
        this.gl.compileShader(fragmentShader);

        // checa erros de compilação
        if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
            const mensagem = this.gl.getShaderInfoLog(fragmentShader);

            if (mensagem !== null) {
                throw new Error(mensagem);
            }
        }

        const programa = this.gl.createProgram();
        if (programa === null) {
            throw new Error('Erro ao criar programa');
        }

        this.gl.attachShader(programa, vertexShader);
        this.gl.attachShader(programa, fragmentShader);
        this.gl.linkProgram(programa);
      
        // checa erros de linkagem
        if (!this.gl.getProgramParameter(programa, this.gl.LINK_STATUS)) {
            const mensagem = this.gl.getShaderInfoLog(vertexShader);

            if (mensagem !== null) {
                throw new Error(mensagem);
            }
        }

        return programa;
    }
}