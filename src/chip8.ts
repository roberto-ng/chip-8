export default class Chip8 {
    private _opcode: number;
    private _i: number;
    private _sp: number;
    private _pc: number;
    private _delayTempo: number;
    private _somTempo: number;
    private _esperandoInput: boolean;
    private _esperandoRegistrador: number;
    private _desenharFlag: boolean;
    private _tela: Array<Array<number>> = new Array(32);
    private _memoria: Uint8Array = new Uint8Array(0x1000);
    private _stack: Uint16Array = new Uint16Array(0xF);
    private _v: Uint8Array = new Uint8Array(0xF);

    public static readonly MEMORIA_TAMANHO: number = 0x1000;

    public constructor() {
        this._opcode = 0;
        this._sp = 0
        this._pc = 0x200;
        this._i = 0x200;
        this._delayTempo = 0;
        this._somTempo = 0;
        this._esperandoInput = false;
        this._esperandoRegistrador = 0;
        this._desenharFlag = false;

        for (let i = 0; i < 32; ++i) {
            this._tela[i] = new Array(64);

            for (let j = 0; j < 64; ++j) {
                this._tela[i][j] = 0;
            }
        }

        for (let i = 0; i < Chip8.MEMORIA_TAMANHO; ++i) {
            this._memoria[i] = 0;
        }

        for (let i = 0; i < 0xF; ++i) {
            this._stack[i] = 0;
        }

        for (let i = 0; i < 0xF; ++i) {
            this._v[i] = 0;
        }
    }

    /** Reseta o emulador ao seu estado inicial */
    public resetar(): void {
        this._opcode = 0;
        this._sp = 0
        this._pc = 0x200;
        this._i = 0x200;
        this._delayTempo = 0;
        this._somTempo = 0;
        this._esperandoInput = false;
        this._esperandoRegistrador = 0;
        this._desenharFlag = false;

        for (let i = 0; i < 32; ++i) {
            for (let j = 0; j < 64; ++j) {
                this._tela[i][j] = 0;
            }
        }

        for (let i = 0; i < Chip8.MEMORIA_TAMANHO; ++i) {
            this._memoria[i] = 0;
        }

        for (let i = 0; i < 0xF; ++i) {
            this._stack[i] = 0;
        }

        for (let i = 0; i < 0xF; ++i) {
            this._v[i] = 0;
        }
    }

    /** 
     * Carrega um programa na memória
     * @param buffer Programa a ser carregado na memória
     */
    public carregarPrograma(buffer: Uint8Array): void {
        buffer.forEach((byte, i) => {
            const pos = i + 0x200;

            if (pos < Chip8.MEMORIA_TAMANHO) {
                this._memoria[pos] = byte;
            }
        });
    }

    /** 
     * Busca o opcode de acordo com o endereço atual do contador de programa 
     * e atribui este valor para a propriedade "opcode" da cpu.
     */
    private buscarOpcode(): void {
        // opcodes tem 2 bytes (16 bits), então, precisamos juntar dois bytes.
        // Por exemplo: se o valor do primeiro byte for A2, e o do segundo for F0, 
        // então o opcode será A2F0.
        // "memoria[pc] << 8" cria 4 zeros no numero (em binario), e depois a operação
        // bitwise OR junta os 2 numeros
        const primeiro = this._memoria[this._pc];
        const segundo = this._memoria[this._pc+1];
        this._opcode = (primeiro << 8) | segundo;
    }

    /**
     * CLR
     * Limpa a tela
     */
    private op00e0_clr(): void {
        for (let i = 0; i < 32; ++i) {
            for (let j = 0; j < 64; ++j) {
                this._tela[i][j] = 0;
            }
        }

        this._desenharFlag = true;
        this._pc += 2;
    }

    /**
     * Opcode 00EE, returna de uma subrotina
     */
    private op_00ee_ret(): void {
        this._pc = this._stack[this._sp-1];
        this._sp -= 1;
        this._pc += 2;
    }

    /**
     * JP endereco
     * Opcode 1nnn: pula o programa para um endereço, onde nnn é o endereço
     */
    private op_1nnn_jp(): void {
        this._pc = this.nnn;
    }

    /**
     * Opcode 2nnn: pula o programa para uma subrotina, onde nnn é o endereço da subrotina.
     */
    private op_2nnn_call(): void {
        // guarda o endereço atual do programa na stack
        this._stack[this._sp] = this._pc;
        this._sp += 1;
        this._pc = this.nnn;
    }

    /**
     * Opcode 3xkk: pula a proxima instrução se kk for igual a Vx
     */
    private op_3xkk_se(): void {
        if (this._v[this.x] == this.kk) {
            this._pc += 4;
        }
        else {
            this._pc += 2;
        }
    }

    /**
     * Opcode 4xkk: pula a proxima instrução se kk for diferente de Vx
     */
    private op_4xkk_sne(): void {
        if (this._v[this.x] != this.kk) {
            this._pc += 4;
        }
        else {
            this._pc += 2;
        }
    }

    /**
     * Opcode 5xy0: pula a proxima instrução se Vx for igual a Vy
     */
    private op_5xy0_se(): void {
        if (this._v[this.x] == this._v[this.y]) {
            this._pc += 4;
        }
        else {
            this._pc += 2;
        }
    }

    /**
     * LD Vx, byte
     * Opcode 6xkk: guarda o valor kk em Vx
     */
    private op_6xkk_ld(): void {
        this._v[this.x] = this.kk;
        this._pc += 2;
    }

    /**
     * ADD Vx, byte
     * Opcode 7xkk: adiciona o valor kk ao registrador Vx
     */
    private op_7xkk_add(): void {
        this._v[this.x] += this.kk;
        this._pc += 2;
    }
    
    /**
     * LD Vx, Vy
     * opcode 8xy0: salva o valor de Vy no registrador Vx
     */
    private op_8xy0_ld(): void {
        this._v[this.x] = this._v[this.y];
        this._pc += 2;
    }

    /** 
     * OR Vx, Vy
     * opcode 8xy1: performa uma uma operação bitwise OR 
     * nos valores de Vx e Vy, e salva o resultado no 
     * registrador Vx
     */
    private op_8xy1_or(): void {
        this._v[this.x] = this._v[this.x] | this._v[this.y];
        this._pc += 2;
    }

    /**
     * AND Vx, Vy
     * opcode 8xy2: performa uma uma operação bitwise AND 
     * nos valores de Vx e Vy, e salva o resultado no 
     * registrador Vx
     */
    private op_8xy2_and(): void {
        this._v[this.x] = this._v[this.x] & this._v[this.y];
        this._pc += 2;
    }

    /**
    * XOR Vx, Vy
    * opcode 8xy3: performa uma uma operação bitwise XOR (OR exclusivo)
    * nos valores de Vx e Vy, e salva o resultado no 
    * registrador Vx 
    */
   private op_8xy3_xor(): void {
        this._v[this.x] = this._v[this.x] ^ this._v[this.y];
        this._pc += 2;
    }

    /**
     * ADD Vx, Vy
     * opcode 8xy4: adiciona o valor de Vy a Vx e ativa a carry flag 
     * do registrador VF caso o resultado seja maior do que 255
     */
    private op_8xy4_add(): void {
        this._v[this.x] += this._v[this.y];
        this._v[0xF] = +(this._v[this.x] > 255);

        /*
        if (this._v[this.x] > 255) {
            this._v[this.x] -= 256;
        }
        */

        this._pc += 2;
    }

    /**
     * SUB Vx, Vy
     * opcode 8xy5: subtrai Vx por Vy e guarda o resultado em Vx.
     * Caso Vx seja maior que Vy, VF é igual a 1, e caso o contrario 
     * é igual a 0
     */
    private op_8xy5_sub(): void {
        this._v[0xF] = +(this._v[this.x] > this._v[this.y]);
        this._v[this.x] -= this._v[this.y];

        /*
        if (this._v[this.x] < 0) {
            this._v[this.x] += 256;
        }
        */

        this._pc += 2;
    }

    /**
     * SHR Vx
     * opcode 8x06: desloca o número uma casa (em binário) para a direita (right shift). 
     * O bit menos significativo do valor original de Vx é salvo no 
     * registrador VF
     */
    private op_8x06_shr(): void {
        this._v[0xF] = this._v[this.x] & 0x1;
        this._v[this.x] >>= 1;
        this._pc += 2;
    }

    /**
     * SUBN Vx, Vy
     * opcode 8xy7: subtrai Vy por Vx e guarda o resultado em Vx.
     * Caso Vx seja maior que Vy, VF é igual a 1, e caso o contrario 
     * é igual a 0
     */
    private op_8xy7_subn(): void {
        this._v[0xF] = +(this._v[this.y] > this._v[this.x]);
        this._v[this.x] = this._v[this.y] - this._v[this.x];
        this._pc += 2;
    }

    /**
     * SHL Vx
     * opcode 8x0E: desloca o número uma casa (em binário) para a esquerda (left shift). 
     * O bit mais significativo do valor original de Vx é salvo no 
     * registrador VF
     */
    private op_8x0e_shl(): void {
        this._v[0xF] = +(this._v[this.x] & 0x80);
        this._v[this.x] <<= 1;
        this._pc += 2;
    }

    /**
     * SNE Vx, Vy
     * Pula a proxima instrução se Vx for diferente de Vy
     */
    private op_9xy0_sne(): void {
        if (this._v[this.x] !== this._v[this.y]) {
            this._pc += 4;
        }
        else {
            this._pc += 2;
        }
    }

    /**
     * JMP V0, endereco
     * Pula para o endereço nnn + V0
     */
    private op_annn_ld(): void {
        this._i = this.nnn;
        this._pc += 2;
    }

    /**
     * JMP V0, endereco
     * Pula para o endereço nnn + V0
     */
    private op_bnnn_jmp(): void {
        this._pc = this.nnn;
    }

    /**
     * RND Vx, byte
     * Vx = byte aleatório & kk
     */
    private op_cxkk_rnd(): void {
        const byte_aleatorio = Math.floor(Math.random() * 0xFF) & (this._opcode & 0xFF);
        this._v[this.x] = byte_aleatorio & this.kk;
    }

    private get opcode(): number {
        return this._opcode;
    }

    /** As 3 últimas casas (em hexadecimal) do opcode */
    private get nnn(): number {
        return this._opcode & 0x0FFF;
    }

    /** As 2 últimas casas (em hexadecimal) do opcode */
    private get kk(): number {
        return this._opcode & 0x00FF;
    }

    /** O número na segunda casa (da esquerda pra direita em hexadecimal) do opcode */
    private get x(): number {
        return (this._opcode & 0x0F00) >> 8;
    }

    /** O número na terceira casa (da esquerda pra direita em hexadecimal) do opcode */
    private get y(): number {
        return (this._opcode & 0x00F0) >> 4;
    }
}