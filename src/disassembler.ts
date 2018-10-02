function hexParaString(hex: number): string {
    const numero = hex.toString(16);
    return `0x${numero.toUpperCase()}`;
}

function decodificar(opcode: number): string {
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
            // TODO: Implementar busca
            return op_str;
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
            // TODO: Implementar busca
            return op_str;
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
        case 0xE000:
            return `SKP v${x}`;
        // identificar operações que começam com E
        case 0xE000:
            // TODO: Implementar busca
            return op_str;
        // identificar operações que começam com F
        case 0xE000:
            // TODO: Implementar busca
            return op_str;
        // opcode não encontrado
        default:
            return op_str;
    }
}