import IRenderizador from './renderizador';

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

    public mudarCor(cor: string): void {
        this._ctx.fillStyle = cor;
    }

    public desenharQuadrado(x: number, y: number, l: number, a: number): void {
        this._ctx.fillRect(x, y, l, a);
    }

    public limparTela(): void {
        this._ctx.clearRect(0, 0, this._largura, this._altura);
    }
}