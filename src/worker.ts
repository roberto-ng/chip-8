import RenderizadorCanvas from './renderizadorCanvas';
import Chip8 from './chip8';

interface MensagemCarregar {
    mensagem: string;
    rom: Uint8Array;
};

const ctx: Worker = self as any;
//const render = new RenderizadorCanvas();
const chip8 = new Chip8();
let jogoCarregado = false;

const atualizarFrame = () => {
    if (jogoCarregado) {
        chip8.emularCiclo();

        if (chip8.desenharFlag) {
            ctx.postMessage({
                mensagem: 'renderizar',
                tela: chip8.tela,
            });
        }
    }

    requestAnimationFrame(atualizarFrame);
};
requestAnimationFrame(atualizarFrame);

ctx.onmessage = evento => {
    const dados: MensagemCarregar = evento.data;

    if (dados.mensagem === 'carregar') {
        if (!(dados.rom instanceof Uint8Array)) {
            window.alert('Erro ao ler arquivo');
            return;
        }

        if (jogoCarregado) {
            chip8.resetar();
        }

        chip8.carregarPrograma(dados.rom);
        jogoCarregado = true;
    }
}