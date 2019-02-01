// renderizador.ts
//
// Copyright 2019 Roberto Nazareth <nazarethroberto97@gmail.com>
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// SPDX-License-Identifier: GPL-3.0-or-later

/**
 * @fileoverview Define uma interface para o renderizador, e também 
 * uma função para renderizar os dados da tela da máquina virtual
 * @author Roberto Nazareth Guedes
 */

export default interface IRenderizador {
    desenharTela(tela: number[][]): void;
    limparTela(): void;
}