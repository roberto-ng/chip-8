/**
 * @author Roberto Nazareth Guedes
 */

import UI from './ui';

function main(): void {
    try {
        const ui = new UI();
        ui.iniciarLoop();
    } catch (e) {
        window.alert(e);
        console.error(e);
    }
}

main();