/**
 * @fileoverview Define uma implementação da interface 
 * IRenderizador, que renderiza usando WebGL
 * @author Roberto Nazareth Guedes
 */

import IRenderizador from './renderizador';

export default class RenderizadorWebGL implements IRenderizador {
    private gl: WebGLRenderingContext;
    private shader: WebGLProgram;
    private textura: WebGLTexture;
    private buffers: {
        tex_coord: WebGLBuffer;
        posicao: WebGLBuffer;
        indices: WebGLBuffer;
    };
    private atributos: {
        tex_coord: number;
        posicao: number;
    };
    private uniformes: {
        textura: WebGLUniformLocation
    };

    public readonly PIXEL_TAMANHO: number = 8;
    public readonly LARGURA: number = 64;
    public readonly ALTURA: number = 32;
    
    
    public constructor(gl: WebGLRenderingContext) {
        this.gl = gl;

        // definição do código fonte do shader
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

        // compila o shader
        this.shader = this.compilarShader(v_source, f_source);


        // definição dos dados que vão ser usados nos buffers da GPU

        // coordenadas da textura, de 0 à 1
        const tex_coords = [
            1.0, 1.0, // cima direita
            1.0, 0.0, // baixo direita
            0.0, 0.0, // baixo esquerda
            0.0, 1.0, // cima esquerda
        ];

        // posição dos vértices
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

        // criação dos buffers na GPU
        const tex_coord_buf = this.gl.createBuffer();
        const posicao_buf = this.gl.createBuffer();
        const indices_buf = this.gl.createBuffer();
        if (tex_coord_buf === null) {
            throw new Error('Erro ao criar tex_coord_buf');
        }
        else if (posicao_buf === null) {
            throw new Error('Erro ao criar posicaoBuffer');
        }
        else if (indices_buf === null) {
            throw new Error('Erro ao criar indicesBuffer');
        }
        this.buffers = {
            tex_coord: tex_coord_buf,
            posicao: posicao_buf,
            indices: indices_buf,
        };
        
        // aqui, atribuimos os dados àos seus referentes buffers
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.posicao);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER, 
            new Float32Array(posicao),
            this.gl.STATIC_DRAW
        );
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.tex_coord);
        this.gl.bufferData(
            this.gl.ARRAY_BUFFER, 
            new Float32Array(tex_coords),
            this.gl.STATIC_DRAW
        );
        this.gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
        this.gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER, 
            new Uint16Array(indices), 
            gl.STATIC_DRAW
        );
        
        // aqui, buscamos as variaveis atributos e uniformes do shader 

        const u_textura = gl.getUniformLocation(this.shader, 'u_textura');
        if (u_textura === null) { 
            throw new Error('erro ao achar u_textura'); 
        }
        this.uniformes = {
            textura: u_textura,
        };

        this.atributos = {
            posicao: gl.getAttribLocation(this.shader, 'a_pos'),
            tex_coord: gl.getAttribLocation(this.shader, 'a_tex_coord'),
        };

        const textura = this.gl.createTexture();
        if (textura === null) {
            throw new Error('Erro ao criar textura');
        }
        this.textura = textura;

        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.limparTela();
    }

    /** Checa se o navegador suporta WebGL */
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

    public limparTela(): void {
        this.gl.clearColor(0, 0, 0, 0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
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
        
        this.gl.enableVertexAttribArray(this.atributos.tex_coord);
        this.gl.enableVertexAttribArray(this.atributos.posicao);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.tex_coord);
        this.gl.vertexAttribPointer(this.atributos.tex_coord, 2, this.gl.FLOAT, false, 0, 0);

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffers.posicao);
        this.gl.vertexAttribPointer(this.atributos.posicao, 3, this.gl.FLOAT, false, 0, 0);        

        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.uniform1i(this.uniformes.textura, 0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.textura);

        this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gl.clearDepth(1.0);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);
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