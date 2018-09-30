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
export default function traduzirInput(tecla_pc: number): number {
    const tecla_chip8 = teclas[tecla_pc];

    // se o valor não estiver no hashmap
    if (typeof tecla_chip8 === 'undefined' || tecla_chip8 === 0) {
        throw new Error('tecla não encontrada');
    }

    return tecla_chip8;
}