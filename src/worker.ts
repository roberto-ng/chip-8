/**
 * @fileoverview Esta thread cuida de processar as instruções 
 * da máquina virtual, enquanto a thread principal renderiza 
 * a tela e recebe input
 * @author Roberto Nazareth Guedes
 */
import Chip8 from './chip8';

interface MensagemCarregar {
    mensagem: string;
    rom: Uint8Array;
    tecla: number;
};

const ctx: Worker = self as any;
const chip8 = new Chip8();
let jogoCarregado = false;

ctx.onmessage = evento => {
    const dados: MensagemCarregar = evento.data;

    if (dados.mensagem === 'carregar') {
        //carregar o programa na memória do CHIP-8

        if (!(dados.rom instanceof Uint8Array)) {
            window.alert('Erro ao ler arquivo');
            return;
        }

        if (jogoCarregado) {
            chip8.resetar();
        }

        chip8.carregarPrograma(dados.rom);
        jogoCarregado = true;
    } else if (dados.mensagem === 'teclaBaixo') {
        // uma tecla foi apertada, registrar input
        console.log(dados.tecla);
        chip8.teclaBaixo(dados.tecla);
    } else if (dados.mensagem === 'teclaCima') {
        // uma tecla foi solta, registrar input
        chip8.teclaCima(dados.tecla);
    }
}

setInterval(() => {
    if (jogoCarregado) {
        chip8.emularCiclo();

        if (chip8.desenharFlag) {
            ctx.postMessage({
                mensagem: 'renderizar',
                tela: chip8.tela,
            });
        }
    }
}, 0.4);