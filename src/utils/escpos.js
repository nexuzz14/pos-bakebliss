const ESC = '\x1B';
const GS = '\x1D';

export const escposCommands = {
  init: ESC + '@',
  alignCenter: ESC + 'a' + '\x01',
  alignLeft: ESC + 'a' + '\x00',
  bold: ESC + 'E' + '\x01',
  boldOff: ESC + 'E' + '\x00',
  cut: GS + 'V' + '\x41' + '\x00',
  newLine: '\n',
  doubleLine: '\n\n',
  feedLines: (n) => ESC + 'd' + String.fromCharCode(n)
};