/**
 * @fileoverview Define uma interface para o renderizador, e também 
 * uma função para renderizar os dados da tela da máquina virtual
 * @author Roberto Nazareth Guedes
 */

export default interface IRenderizador {
    desenharTela(tela: number[][]): void;
    limparTela(): void;
}