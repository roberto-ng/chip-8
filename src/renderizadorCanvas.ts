/**
 * @fileoverview Define uma implementação da interface 
 * IRenderizador, que renderiza em um HTMLCanvasElement
 * @author Roberto Nazareth Guedes
 */

import IRenderizador, { renderizar } from './renderizador';

export default class RenderizadorCanvas implements IRenderizador {
    private _ctx: CanvasRenderingContext2D;
    private _largura: number;
    private _altura: number;
    public readonly PIXEL_TAMANHO: number = 8;
    
    public constructor(ctx: CanvasRenderingContext2D) {
        this._ctx = ctx;
        this._largura = this.PIXEL_TAMANHO * 64;
        this._altura = this.PIXEL_TAMANHO * 32;
    }

    public mudarCor(r: number, g: number, b: number): void {
        this._ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    }

    public desenharQuadrado(x: number, y: number, l: number, a: number): void {
        this._ctx.fillRect(x, y, l, a);
    }

    public desenharTela(tela: number[][]): void {
        renderizar(this, tela);
    }

    public limparTela(): void {
        this._ctx.clearRect(0, 0, this._largura, this._altura);
    }

    public encerrarFrame(): void {
    }
}