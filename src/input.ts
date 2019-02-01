// input.ts
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

const teclas: {[key: number]: number|undefined} = {
    49: 0x1, // 1
    50: 0x2, // 2
    51: 0x3, // 3
    52: 0xC, // 4
    65: 0x7, // A
    67: 0xB, // C
    68: 0x9, // D
    69: 0x6, // E
    70: 0xE, // F
    81: 0x4, // Q
    82: 0xD, // R
    83: 0x8, // S
    86: 0xF, // V
    87: 0x5, // W
    88: 0x0, // X
    90: 0xA, // Z
};

/**
 * Traduz o valor de uma tecla do PC para a tecla 
 * correspondente no CHIP-8
 * @param tecla_pc O valor da tecla do PC
 * @returns O valor convertido
 */
export function traduzirInput(tecla_pc: number): number {
    const tecla_chip8 = teclas[tecla_pc];

    // se o valor não estiver no hashmap
    if (typeof tecla_chip8 === 'undefined') {
        throw new Error('tecla não encontrada');
    }

    return tecla_chip8;
}