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

    public get opcode(): number {
        return this._opcode;
    }

    /** As 3 últimas casas (em hexadecimal) do opcode */
    public get nnn(): number {
        return this._opcode & 0x0FFF;
    }

    /** As 2 últimas casas (em hexadecimal) do opcode */
    public get kk(): number {
        return this._opcode & 0x00FF;
    }

    /** O número na segunda casa (da esquerda pra direita em hexadecimal) do opcode */
    public get x(): number {
        return (this._opcode & 0x0F00) >> 8;
    }

    /** O número na terceira casa (da esquerda pra direita em hexadecimal) do opcode */
    public get y(): number {
        return (this._opcode & 0x00F0) >> 4;
    }
}