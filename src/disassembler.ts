// disassembler.ts
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

import Chip8 from './chip8';

function hexParaString(hex: number): string {
    const numero = hex.toString(16);
    return `0x${numero.toUpperCase()}`;
}

export function decodificarPrograma(programa: Uint8Array): {[key: number]: string|undefined} {
    let resultado: {[key: number]: string|undefined} = {};

    if (programa.length > Chip8.MEMORIA_TAMANHO) {
        throw new Error('O arquivo ultrapassa o tamanho máximo');
    }

    for (let i = 0; i < programa.length; i++) {
        if (i+1 > programa.length) {
            continue;
        }

        const byte1 = programa[i];
        const byte2 = programa[i+1];

        if (byte1 === undefined || byte2 === undefined) {
            continue;
        }

        const opcode = (byte1 << 8) | byte2;
        resultado[i] = decodificarOpcode(opcode);
    }

    return resultado;
}

export function decodificarOpcode(opcode: number): string {
    const op_str = hexParaString(opcode);
    const nnn = hexParaString(opcode & 0x0FFF);
    const kk = hexParaString(opcode & 0x00FF);
    const n = hexParaString(opcode & 0x000F);

    const x = 
        ((opcode & 0x0F00) >> 8)
            .toString(16)
            .toUpperCase();

    const y = 
        ((opcode & 0x00F0) >> 4)
            .toString(16)
            .toUpperCase();

    switch (opcode & 0xF000) {
        // identificar operações que começam com 0
        case 0x0000:
            switch (opcode & 0x00FF) {
                // 00E0
                case 0x00E0:
                    return 'CLS';
                // 00EE
                case 0x00EE:
                    return 'RETURN';
                default: return op_str;
            }
        // 1nnn
        case 0x1000:
            return `JUMP ${nnn}`;
        // 2nnn
        case 0x2000:
            return `CALL ${nnn}`;
        // 3xkk
        case 0x3000:
            return `SE v${x}, ${kk}`;
        // 4xkk
        case 0x4000:
            return `SNE v${x}, ${kk}`;
        // 5xy0
        case 0x5000:
            return `SE v${x}, v${y}`;
        // 6xkk
        case 0x6000:
            return `LD v${x}, ${kk}`;
        // 7xkk    
        case 0x7000:
            return `ADD v${x}, ${kk}`
        // identificar operações que começam com 8 
        case 0x8000:
            switch (opcode & 0x000F) {
                // 8xy0
                case 0x0000:
                    return `LD v${x}, v${y}`;
                // 8xy1
                case 0x0001:
                    return `OR v${x}, v${y}`;
                // 8xy2
                case 0x0002:
                    return `AND v${x}, v${y}`;
                // 8xy3
                case 0x0003:
                    return `XOR v${x}, v${y}`;
                // 8xy4
                case 0x0004:
                    return `ADD v${x}, v${y}`;
                // 8xy5
                case 0x0005:
                    return `SUB v${x}, v${y}`;
                // 8xy6
                case 0x0006:
                    return `SHR v${x}`;
                // 8xy7
                case 0x0007:
                    return `SUBN v${x}, v${y}`;
                // 8xyE
                case 0x000E:
                    return `SHL v${x}`;
                default: return op_str;
            }
        // 9xy0
        case 0x9000:
            return `SNE v${x}, v${y}`;
        // Annn
        case 0xA000:
            return `LD I, ${nnn}`;
        // Bnnn
        case 0xB000:
            return `JP v0, ${nnn}`;
        // Cxkk
        case 0xC000:
            return `RND v${x}, ${kk}`;
        // Dxyn
        case 0xD000:
            return `DRW v${x}, v${y}, ${n}`;
        // identificar operações que começam com E
        case 0xE000:
            switch (opcode & 0x00FF) {
                // Ex9E
                case 0x009E:
                    return `SKP v${x}`;
                // ExA1
                case 0x00A1:
                    return `SKNP v${x}`;
                default: return op_str;
            }
        // identificar operações que começam com F
        case 0xF000:
            switch (opcode & 0x00FF) {
                // Fx07
                case 0x0007:
                    return `LD v${x}, DT`;
                // Fx0A
                case 0x000A:
                    return `LD v${x}, K`;
                // Fx15
                case 0x0015:
                    return `LD DT, v${x}`;
                // Fx18
                case 0x0018:
                    return `LD ST, v${x}`;
                // Fx1E    
                case 0x001E:
                    return `ADD I, v${x}`;
                // Fx29    
                case 0x0029:
                    return `LD F, v${x}`;
                // Fx33
                case 0x0033:
                    return `LD B, v${x}`;
                // Fx55
                case 0x0055:
                    return `LD [I], v${x}`;
                // Fx65
                case 0x0065:
                    return `LD v${x}, [I]`;
                default: return op_str;
            }
        // opcode não encontrado
        default: return op_str;
    }
}