/**
 * @fileoverview Define uma interface para o renderizador, e também 
 * uma função para renderizar os dados da tela da máquina virtual
 * @author Roberto Nazareth Guedes
 */

export default interface IRenderizador {
    mudarCor(r: number, g: number, b: number): void;
    desenharQuadrado(x: number, y: number, l: number, a: number): void;
    desenharTela(tela: number[][]): void;
    limparTela(): void;
    encerrarFrame(): void;
}

export function renderizar(render: IRenderizador, tela: number[][]) {
    render.limparTela();

    for (let y = 0; y < 32; ++y) {
        for (let x = 0; x < 64; ++x) {
            const pixel = tela[y][x];

            if (pixel !== 0) {
                render.mudarCor(255, 255, 255);
            } else {
                render.mudarCor(57, 50, 71);
            }

            render.desenharQuadrado(x * 8, y * 8, 8, 8);
        }
    }
}