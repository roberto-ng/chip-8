// renderizadorCanvas.ts
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

/** Usa a API do Canvas2D para renderizar a tela */
export default class RenderizadorCanvas implements IRenderizador {
    private ctx: CanvasRenderingContext2D;

    readonly PIXEL_TAMANHO: number = 8;
    readonly LARGURA: number = 8 * 64;
    readonly ALTURA: number = 8 * 32;
    
    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    mudarCor(r: number, g: number, b: number): void {
        this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    }

    desenharQuadrado(x: number, y: number, l: number, a: number): void {
        this.ctx.fillRect(x, y, l, a);
    }

    desenharTela(tela: number[][]): void {
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

    limparTela(): void {
        this.ctx.clearRect(0, 0, this.LARGURA, this.ALTURA);
    }

    encerrarFrame(): void {
    }
}