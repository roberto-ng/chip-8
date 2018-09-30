export default interface IRenderizador {
    mudarCor(cor: string): void;
    desenharQuadrado(x: number, y: number, l: number, a: number): void;
    limparTela(): void;
}