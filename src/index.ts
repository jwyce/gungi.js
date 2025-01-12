// import { ADVANCED_POSITION, Gungi } from './gungi';

export * from './gungi';

// function clearTerminal() {
// 	process.stdout.write('\x1b[2J');
// 	process.stdout.write('\x1b[H');
// }
//
// function printText(text: string) {
// 	clearTerminal();
// 	process.stdout.write(text);
// }
//
// const gungi = new Gungi(ADVANCED_POSITION);
//
// while (!gungi.isGameOver()) {
// 	const moves = gungi.moves();
// 	const move = moves[Math.floor(Math.random() * moves.length)];
// 	gungi.move(move);
// 	printText(gungi.ascii());
// }
//
// console.log(gungi.fen() + '\n');
// console.log(gungi.pgn());
