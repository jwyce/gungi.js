import { ADVANCED_POSITION, Gungi } from './gungi';

export * from './gungi';

function clearTerminal() {
	process.stdout.write('\x1b[2J');
	process.stdout.write('\x1b[H');
}

function printText(text: string) {
	clearTerminal();
	process.stdout.write(text);
}

const gungi = new Gungi(ADVANCED_POSITION);

while (!gungi.isGameOver()) {
	const moves = gungi.moves();
	const move = moves[Math.floor(Math.random() * moves.length)];
	gungi.move(move);
	printText(gungi.ascii());
}

console.log(gungi.fen() + '\n');
console.log(gungi.pgn());

// Uncomment below to run interactive game with piece ID visualization
/*
import { createInterface } from "readline";
import { BEGINNER_POSITION } from "./gungi";

function clearTerminal() {
	process.stdout.write("\x1b[2J");
	process.stdout.write("\x1b[H");
}

function formatPieceIds(gungi: Gungi): string {
	const boardPieces: Array<{ square: string; id: string; piece: string }> = [];
	const handPieces: Array<{
		color: string;
		type: string;
		count: number;
		id: string;
	}> = [];

	// Collect board pieces with IDs
	for (let rank = 1; rank <= 9; rank++) {
		for (let file = 1; file <= 9; file++) {
			const square = `${rank}-${file}`;
			const tower = gungi.get(square);
			if (tower && tower.length > 0) {
				for (const piece of tower) {
					if (piece.id) {
						boardPieces.push({
							square,
							id: piece.id,
							piece: `${piece.color}${piece.type}${piece.tier > 1 ? `(T${piece.tier})` : ""}`,
						});
					}
				}
			}
		}
	}

	// Collect hand pieces with IDs
	const whiteHand = gungi.hand("w");
	const blackHand = gungi.hand("b");

	for (const hp of [...whiteHand, ...blackHand]) {
		if (hp.id && hp.count > 0) {
			handPieces.push({
				color: hp.color,
				type: hp.type,
				count: hp.count,
				id: hp.id,
			});
		}
	}

	// Format with each rank on its own line
	let result = "\nPiece IDs:\n";

	// Board pieces - group by rank with each rank on its own line
	const boardByRank: { [key: number]: string[] } = {};
	for (const p of boardPieces) {
		const rank = parseInt(p.square.split("-")[0]);
		if (!boardByRank[rank]) boardByRank[rank] = [];
		boardByRank[rank].push(`${p.square}=${p.id}`);
	}

	result += "Board:\n";
	for (let rank = 1; rank <= 9; rank++) {
		if (boardByRank[rank] && boardByRank[rank].length > 0) {
			result += `  R${rank}: ${boardByRank[rank].join(", ")}\n`;
		}
	}

	// Hand pieces
	if (handPieces.length > 0) {
		result += "Hand: ";
		const handStrs = handPieces.map(
			(hp) => `${hp.color}${hp.type}×${hp.count}=${hp.id}`,
		);
		result += handStrs.join(" ");
	}

	return result;
}

function waitForEnter(): Promise<void> {
	const rl = createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	return new Promise((resolve) => {
		rl.question("\nPress Enter for next move...", () => {
			rl.close();
			resolve();
		});
	});
}

function getPieceIdBeforeMove(gungi: Gungi, move: string): string | null {
	// Parse the move to find the source square
	// Move format examples: "兵(7-5-1)(6-5-1)", "新兵(6-5-1)", etc.
	const fromMatch = move.match(/\((\d-\d)-\d\)\(/);
	if (fromMatch) {
		const fromSquare = fromMatch[1];
		const piece = gungi.getTop(fromSquare);
		return piece?.id || null;
	}

	// For arata moves (hand to board), check hand pieces
	const arataMatch = move.match(/新(.+)\((\d-\d-\d)\)/);
	if (arataMatch) {
		const pieceType = arataMatch[1];
		const turn = gungi.turn();
		const handPieces = gungi.hand(turn);
		const handPiece = handPieces.find(
			(hp) => hp.type === pieceType && hp.count > 0,
		);
		return handPiece?.id || null;
	}

	return null;
}

async function playGame() {
	const gungi = new Gungi(BEGINNER_POSITION);

	// Show initial position
	clearTerminal();
	console.log(gungi.ascii());
	console.log(formatPieceIds(gungi));
	console.log(`\nFEN: ${gungi.fen()}`);
	console.log(
		`\nMove ${gungi.moveNumber()}, ${gungi.turn() === "w" ? "White" : "Black"} to move`,
	);
	await waitForEnter();

	while (!gungi.isGameOver()) {
		const moves = gungi.moves() as string[];
		const move = moves[Math.floor(Math.random() * moves.length)];

		// Get the piece ID before making the move
		const pieceIdBeforeMove = getPieceIdBeforeMove(gungi, move);

		const moveResult = gungi.move(move);

		clearTerminal();
		console.log(gungi.ascii());
		console.log(formatPieceIds(gungi));
		console.log(`\nFEN: ${gungi.fen()}`);
		console.log(`\nLast move: ${moveResult.san}`);
		if (pieceIdBeforeMove) {
			console.log(`Moved piece ID: ${pieceIdBeforeMove}`);
		}
		console.log(
			`Move ${gungi.moveNumber()}, ${gungi.turn() === "w" ? "White" : "Black"} to move`,
		);

		if (!gungi.isGameOver()) {
			await waitForEnter();
		}
	}

	console.log("\n=== Game Over ===");
	console.log(`Final FEN: ${gungi.fen()}`);
	console.log("\nPGN:");
	console.log(gungi.pgn());
}

playGame().catch(console.error);
*/
