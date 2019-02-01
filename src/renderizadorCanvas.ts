/**
 * @fileoverview Define uma implementação da interface 
 * IRenderizador, que renderiza em um HTMLCanvasElement
 * @author Roberto Nazareth Guedes
 */

import IRenderizador from './renderizador';

export default class RenderizadorCanvas implements IRenderizador {
    private ctx: CanvasRenderingContext2D;

    public readonly PIXEL_TAMANHO: number = 8;
    public readonly LARGURA: number = 8 * 64;
    public readonly ALTURA: number = 8 * 32;
    
    public constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public mudarCor(r: number, g: number, b: number): void {
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    }

    public desenharQuadrado(x: number, y: number, l: number, a: number): void {
        this.ctx.fillRect(x, y, l, a);
    }

    public desenharTela(tela: number[][]): void {
        this.limparTela();
        
        for (let y = 0; y < 32; ++y) {
            for (let x = 0; x < 64; ++x) {
                const pixel = tela[y][x];
        
                if (pixel !== 0) {
                    this.mudarCor(255, 255, 255);
                } else {
                    this.mudarCor(57, 50, 71);
                }
        
                const tam = this.PIXEL_TAMANHO;
                this.desenharQuadrado(x * tam, y * tam, tam, tam);
            }
        }
    }

    public limparTela(): void {
        this.ctx.clearRect(0, 0, this.LARGURA, this.ALTURA);
    }

    public encerrarFrame(): void {
    }
}