/**
 * @author Roberto Nazareth Guedes
 */

import Emulador from './emulador';

function main(): void {
    try {
        const emulador = new Emulador();
        emulador.iniciarLoop();
    } catch (e) {
        window.alert(e);
        console.error(e);
    }
}

main();