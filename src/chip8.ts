/**
 * @fileoverview Máquina vírtual do CHIP-8
 * @author Roberto Nazareth Guedes
 */

export default class Chip8 {
    private _opcode: number;
    /** Registrador de endereço da memória */
    private _i: number;
    /** Ponteiro da stack */
    private _sp: number;
    /** Contador de programa */
    private _pc: number;
    private _delayTempo: number;
    private _somTempo: number;
    private _esperandoInput: boolean;
    private _esperandoRegistrador: number;
    private _desenharFlag: boolean;
    /** Array 2D representando a tela do CHIP-8 */
    private _tela: Array<Array<number>>;
    /** Buffer representando a memória do CHIP-8 */
    private _memoria: Uint8Array;
    /** Buffer representando a stack do CHIP-8 */
    private _stack: Uint16Array;
    /** Buffer representando os registradores do CHIP-8 */
    private _v: Uint8Array;
    /** Buffer representando o teclado do CHIP-8 */
    private _teclado: Uint8Array;

    public static readonly MEMORIA_TAMANHO: number = 0x1000;

    public constructor() {
        this._opcode = 0;
        this._sp = 0
        this._pc = 0x200;
        this._i = 0;
        this._delayTempo = 0;
        this._somTempo = 0;
        this._esperandoInput = false;
        this._esperandoRegistrador = 0;
        this._desenharFlag = false;
        this._tela = new Array(32);
        this._memoria = new Uint8Array(0x1000);
        this._stack = new Uint16Array(16);
        this._v = new Uint8Array(16);
        this._teclado = new Uint8Array(16);

        for (let i = 0; i < 32; ++i) {
            this._tela[i] = new Array(64);

            for (let j = 0; j < 64; ++j) {
                this._tela[i][j] = 0;
            }
        }

        for (let i = 0; i < Chip8.MEMORIA_TAMANHO; ++i) {
            this._memoria[i] = 0;
        }

        for (let i = 0; i < this._stack.length; ++i) {
            this._stack[i] = 0;
        }

        for (let i = 0; i < this._v.length; ++i) {
            this._v[i] = 0;
        }

        for (let i = 0; i < this._teclado.length; ++i) {
            this._teclado[i] = 0;
        }

        this.carregarFonte();
    }

    /** Reseta o emulador ao seu estado inicial */
    public resetar(): void {
        this._opcode = 0;
        this._sp = 0
        this._pc = 0x200;
        this._i = 0;
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

        for (let i = 0; i < 16; ++i) {
            this._stack[i] = 0;
        }

        for (let i = 0; i < 16; ++i) {
            this._v[i] = 0;
        }

        for (let i = 0; i < 16; ++i) {
            this._teclado[i] = 0;
        }

        this.carregarFonte();
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

    /** Emula um ciclo da CPU */
    public emularCiclo(): void {
        if (this._esperandoInput) {
            this._teclado.forEach(tecla => {
                if (tecla !== 0) {
                    // parar de esperar input se o
                    // usuário pressionar uma tecla
                    this._esperandoInput = false;
                    this._v[this._esperandoRegistrador] = tecla;
                }
            });

            return;
        }

        this.buscarOpcode();
        this.executarOpcode();

        if (this._delayTempo > 0) {
            --this._delayTempo;
        }

        if (this._somTempo > 0) {
            if (this._somTempo === 1) {
                // BEEP
            }

            --this._somTempo;
        }
    }

    /** Carrega a fonte na memória */
    private carregarFonte(): void {
        const fonte = [
            0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
            0x20, 0x60, 0x20, 0x20, 0x70, // 1
            0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
            0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
            0x90, 0x90, 0xF0, 0x10, 0x10, // 4
            0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
            0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
            0xF0, 0x10, 0x20, 0x40, 0x40, // 7
            0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
            0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
            0xF0, 0x90, 0xF0, 0x90, 0x90, // A
            0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
            0xF0, 0x80, 0x80, 0x80, 0xF0, // C
            0xE0, 0x90, 0x90, 0x90, 0xE0, // D
            0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
            0xF0, 0x80, 0xF0, 0x80, 0x80, // F          
        ];

        for (let i = 0; i < 80; ++i) {
            this._memoria[i] = fonte[i];
        }
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

    private executarOpcode(): void {
        switch (this._opcode & 0xF000) {
            case 0x0000: this.executarOp_0xxx(); break;
            case 0x1000: this.op_1nnn_jp(); break;
            case 0x2000: this.op_2nnn_call(); break;
            case 0x3000: this.op_3xkk_se(); break;
            case 0x4000: this.op_4xkk_sne(); break;
            case 0x5000: this.op_5xy0_se(); break;
            case 0x6000: this.op_6xkk_ld(); break;
            case 0x7000: this.op_7xkk_add(); break;
            case 0x8000: this.executarOp_8xxx(); break;
            case 0x9000: this.op_9xy0_sne(); break;
            case 0xA000: this.op_annn_ld(); break;
            case 0xB000: this.op_bnnn_jmp(); break;
            case 0xC000: this.op_cxkk_rnd(); break;
            case 0xD000: this.op_dxyn_draw(); break;
            case 0xE000: this.executarOp_exxx(); break;
            case 0xF000: this.executarOp_fxxx(); break;
            default:
                console.error(`Opcode desconhecido: ${this._opcode}`);
                this._pc += 2;
                break;
        }
    }

    private executarOp_0xxx(): void {
        switch (this._opcode & 0x00FF) {
            case 0x00EE: this.op_00ee_ret(); break;
            case 0x00E0: this.op_00e0_clr(); break;
            default:
                console.error(`Opcode desconhecido: ${this._opcode}`);
                this._pc += 2;
                break;
        }
    }

    private executarOp_8xxx(): void {
        switch (this._opcode & 0x000F) {
            case 0x0000: this.op_8xy0_ld(); break;
            case 0x0001: this.op_8xy1_or(); break;
            case 0x0002: this.op_8xy2_and(); break;
            case 0x0003: this.op_8xy3_xor(); break;
            case 0x0004: this.op_8xy4_add(); break;
            case 0x0005: this.op_8xy5_sub(); break;
            case 0x0006: this.op_8x06_shr(); break;
            case 0x0007: this.op_8xy7_subn(); break;
            case 0x000E: this.op_8x0e_shl(); break;
            default:
                console.error(`Opcode desconhecido: ${this._opcode}`);
                this._pc += 2;
                break;
        }
    }

    private executarOp_exxx(): void {
        switch (this._opcode & 0x00FF) {
            case 0x009E: this.op_ex9e_skp(); break;
            case 0x00A1: this.op_exa1_sknp(); break;
            default:
                console.error(`Opcode desconhecido: ${this._opcode}`);
                this._pc += 2;
                break;
        }
    }

    private executarOp_fxxx(): void {
        switch (this._opcode & 0x00FF) {
            case 0x0007: this.op_fx07_ld(); break;
            case 0x000A: this.op_fx0a_ld(); break;
            case 0x0015: this.op_fx15_ld(); break;
            case 0x0018: this.op_fx18_ld(); break;
            case 0x001E: this.op_fx1e_add(); break;
            case 0x0029: this.op_fx29_ld(); break;
            case 0x0033: this.op_fx33_ld(); break;
            case 0x0055: this.op_fx55_ld(); break;
            case 0x0065: this.op_fx65_ld(); break;
            default:
                console.error(`Opcode desconhecido: ${this._opcode}`);
                this._pc += 2;
                break;
        }
    }

    /**
     * CLR
     * Limpa a tela
     */
    private op_00e0_clr(): void {
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
        if (this._v[this.x] === this.kk) {
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
        if (this._v[this.x] !== this.kk) {
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
        if (this._v[this.x] === this._v[this.y]) {
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
        this._v[this.x] |= this._v[this.y];
        this._pc += 2;
    }

    /**
     * AND Vx, Vy
     * opcode 8xy2: performa uma uma operação bitwise AND 
     * nos valores de Vx e Vy, e salva o resultado no 
     * registrador Vx
     */
    private op_8xy2_and(): void {
        this._v[this.x] &= this._v[this.y];
        this._pc += 2;
    }

    /**
    * XOR Vx, Vy
    * opcode 8xy3: performa uma uma operação bitwise XOR (OR exclusivo)
    * nos valores de Vx e Vy, e salva o resultado no 
    * registrador Vx 
    */
   private op_8xy3_xor(): void {
        this._v[this.x] ^= this._v[this.y];
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
        let vx = this._v[this.x];
        this._v[0xF] = 0x1 & vx;
        this._v[this.x] = vx >> 1;
        this._pc += 2;
    }

    /**
     * SUBN Vx, Vy
     * opcode 8xy7: subtrai Vy por Vx e guarda o resultado em Vx.
     * Caso Vx seja maior que Vy, VF é igual a 1, e caso o contrario 
     * é igual a 0
     */
    private op_8xy7_subn(): void {
        let vx = this._v[this.x];
        let vy = this._v[this.y];

        this._v[0xF] = vy > vx ? 1 : 0;
        this._v[this.x] = vy - vx;

        this._pc += 2;
    }

    /**
     * SHL Vx
     * opcode 8x0E: desloca o número uma casa (em binário) para a esquerda (left shift). 
     * O bit mais significativo do valor original de Vx é salvo no 
     * registrador VF
     */
    private op_8x0e_shl(): void {
        let vx = this._v[this.x];

        /*
        this._v[0xF] = +(this._v[this.x] & 0x80);
        this._v[this.x] <<= 1;
        */

        this._v[0xF] = vx >> 7;
        this._v[this.x] = vx << 1;

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
        this._pc = this._v[this.x] + this.nnn;
    }

    /**
     * RND Vx, byte
     * Vx = byte aleatório & kk
     */
    private op_cxkk_rnd(): void {
        const byte_aleatorio = Math.floor(Math.random() * 0xFF) & (this._opcode & 0xFF);
        this._v[this.x] = byte_aleatorio & this.kk;
        this._pc += 2;
    }

    private setPixel(pos_x: number, pos_y: number, fim_sprite: number): number {
        let colisao = 0;
        const sprite = this._memoria.slice(this._i, fim_sprite+1);

        for (let i = 0; i < sprite.length-1; ++i) {
            for (let j = 0; j < 8; ++j) {
                const x = (pos_x + j) % 64;
                const y = (pos_y + i) % 32;

                if ((sprite[i] & (0x80 >> j)) !== 0) {
                    if (this._tela[y][x] === 1) {
                        colisao = 1;
                    }

                    this._tela[y][x] ^= 1;
                }
            }
        }

        this._desenharFlag = true;
        return colisao;
    }

    /**
     * Desenha um sprite na coordenada (Vx, Vy), com 8 pixels de largura e N de altura
     */
    private op_dxyn_draw(): void {
        let n = this._opcode & 0x000F;
        let fim_sprite = this._i + n;
        this._v[0xF] = this.setPixel(this._v[this.x], this._v[this.y], fim_sprite);

        this._pc += 2;
    }

    /**
     * SKP Vx
     * pula a próxima instrução se a tecla com o valor de Vx estiver sendo pressionada
     */
    private op_ex9e_skp(): void {
        const tecla = this._v[this.x];
        if (this._teclado[tecla] !== 0) {
            this._pc += 4;
        }
        else {
            this._pc += 2;
        }
    }

    /**
     * SKNP Vx
     * pula a próxima instrução se a tecla com o valor de Vx não estiver sendo pressionada
     */
    private op_exa1_sknp(): void {
        const tecla = this._v[this.x];
        if (this._teclado[tecla] === 0) {
            this._pc += 4;
        }
        else {
            this._pc += 2;
        }
    }

    /**
     * LD Vx, K
     * Espera o usuário pressionar uma tecla, e atribui o valor a Vx
     */
    private op_fx0a_ld(): void {
        //this._esperandoRegistrador = this.x;
        this._esperandoInput = true;
        this._esperandoRegistrador = this.x;

        for (let i = 0; i < this._teclado.length; ++i) {
            this._teclado[i] = 0;
        }

        this._pc += 2;
    }

    /**
     * LD Vx, DELAY_TIMER
     * Atribui o valor do temporizador de delay ao Vx
     */
    private op_fx07_ld(): void {
        this._v[this.x] = this._delayTempo;
        this._pc += 2;
    }

    /**
     * LD DELAY_TIMER, Vx
     * Atribui o valor de Vx ao temporizador de delay
     */
    private op_fx15_ld(): void {
        this._delayTempo = this._v[this.x];
        this._pc += 2;
    }

    /**
     * LD SOUND_TIMER, Vx
     * Atribui o valor de Vx ao temporizador de som
     */
    private op_fx18_ld(): void {
        this._somTempo = this._v[this.x];
        this._pc += 2;
    }

    /**
     * ADD I, Vx
     * I = I + Vx
     */
    private op_fx1e_add(): void {
        this._i += this._v[this.x];
        this._pc += 2;
    }

    /**
     * LD F, Vx
     * Atribui ao I o endereço do sprite correspondente à Vx
     */
    private op_fx29_ld(): void {
        this._i = this.x * 5;
        this._pc += 2;
    }

    /**
     * LD B, Vx
     * opcode Fx33: Guarda a representação em codificação binária decimal (BCD) 
     * do valor do registrador Vx. O digito na casa das centenas será salvo no 
     * endereço "i" (o registrador de index), a casa das dezenas será salva no 
     * endereço "i + 1", e o digito da casa das unidades erá salvo em "i + 2"
     */
    private op_fx33_ld(): void {
        const valor = this._v[this.x];
        this._memoria[this._i] = valor / 100;
        this._memoria[this._i+1] = (valor / 10) % 10;
        this._memoria[this._i+2] = (valor % 100) % 10;
        this._pc += 2;
    }

    /**
     * LD [I], Vx
     * Guarda os valores de V0 à Vx na memória a partir do endereço I
     */
    private op_fx55_ld(): void {
        for (let i = 0; i <= this.x; i++) {
            this._memoria[i + this._i] = this._v[i];
        }

        this._pc += 2;
    }

    /**
     * LD Vx, [I]
     * Preenche os registradores de V0 à Vx com valores na memória a partir do endereço I
     */
    private op_fx65_ld(): void {
        for (let i = 0; i <= this.x; i++) {
            this._v[i] = this._memoria[i + this._i];
        }

        this._pc += 2;
    }

    /** Registra que uma tecla foi apertada */
    public teclaBaixo(tecla: number): void {
        this._teclado[tecla] = 1;
    }

    /** Registra que uma tecla foi solta */
    public teclaCima(tecla: number): void {
        this._teclado[tecla] = 0;
    }

    public get v(): Uint8Array {
        return this._v;
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

    public get desenharFlag(): boolean {
        return this._desenharFlag;
    }

    public get tela(): number[][] {
        return this._tela;
    }

    public get teclado(): Uint8Array {
        return this._teclado;
    }
}