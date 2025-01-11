import { ADVANCED_POSITION, Gungi } from './gungi';

export * from './gungi';

// Function to clear the terminal
function clearTerminal() {
	process.stdout.write('\x1b[2J'); // ANSI escape sequence to clear the terminal
	process.stdout.write('\x1b[H'); // Move cursor to the home position (top-left)
}

// Function to print text without flicker
function printText(text: string) {
	clearTerminal();
	process.stdout.write(text);
}

function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const main = async () => {
	const gungi = new Gungi(ADVANCED_POSITION);

	let steps = 10_000;
	gungi.print();

	while (!gungi.isGameOver() && steps > 0) {
		const moves = gungi.moves();
		const move = moves[Math.floor(Math.random() * moves.length)];
		gungi.move(move);
		printText(gungi.ascii());

		await sleep(5);
		steps--;
	}

	console.log(gungi.fen() + '\n');
	console.log(gungi.pgn());
};

main().catch(console.error);
