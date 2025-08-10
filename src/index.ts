export * from './gungi';

// Uncomment the code below to run an interactive demo showing piece ID tracking in action:

// import { ADVANCED_POSITION, Gungi } from './gungi';
//
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
// function waitForEnter(): Promise<void> {
// 	return new Promise(resolve => {
// 		process.stdin.setRawMode(true);
// 		process.stdin.resume();
// 		process.stdin.once('data', (data) => {
// 			const input = data.toString();
// 			if (input === '\r' || input === '\n' || input === '\x0D') {
// 				process.stdin.setRawMode(false);
// 				process.stdin.pause();
// 				resolve();
// 			} else {
// 				// If not enter, wait again
// 				process.stdin.setRawMode(false);
// 				process.stdin.pause();
// 				waitForEnter().then(resolve);
// 			}
// 		});
// 	});
// }
//
// function printIdInfo(gungi: Gungi, move: string) {
// 	console.log(`\n=== Move: ${move} ===`);
//
// 	// Get all pieces on board
// 	const boardPieces: Array<{square: string, piece: string, id: string}> = [];
// 	for (let rank = 1; rank <= 9; rank++) {
// 		for (let file = 1; file <= 9; file++) {
// 			const piece = gungi.getTop(`${rank}-${file}`);
// 			if (piece && piece.id) {
// 				boardPieces.push({
// 					square: piece.square,
// 					piece: `${piece.type}${piece.color}`,
// 					id: piece.id
// 				});
// 			}
// 		}
// 	}
//
// 	// Print board pieces in compact columns
// 	console.log('Board IDs:');
// 	if (boardPieces.length === 0) {
// 		console.log('  (no pieces on board)');
// 	} else {
// 		// Split into 3 columns for better screen fit
// 		const cols = 3;
// 		const itemsPerCol = Math.ceil(boardPieces.length / cols);
//
// 		for (let i = 0; i < itemsPerCol; i++) {
// 			let line = '';
// 			for (let col = 0; col < cols; col++) {
// 				const idx = col * itemsPerCol + i;
// 				if (idx < boardPieces.length) {
// 					const item = boardPieces[idx];
// 					const entry = `${item.square}:${item.piece}=${item.id.split('-').pop()}`;
// 					line += entry.padEnd(18);
// 				}
// 			}
// 			console.log('  ' + line.trim());
// 		}
// 	}
//
// 	// Show hand piece IDs compactly
// 	const whiteHand = gungi.getHandWithIds('w');
// 	const blackHand = gungi.getHandWithIds('b');
//
// 	console.log('White Hand:');
// 	if (whiteHand.length === 0) {
// 		console.log('  (empty)');
// 	} else {
// 		const whiteEntries = whiteHand
// 			.filter(hp => hp.count > 0)
// 			.map(hp => `${hp.type}(${hp.count}):[${(hp.ids || []).map(id => id.split('-').pop()).join(',')}]`)
// 			.join('  ');
// 		console.log('  ' + whiteEntries);
// 	}
//
// 	console.log('Black Hand:');
// 	if (blackHand.length === 0) {
// 		console.log('  (empty)');
// 	} else {
// 		const blackEntries = blackHand
// 			.filter(hp => hp.count > 0)
// 			.map(hp => `${hp.type}(${hp.count}):[${(hp.ids || []).map(id => id.split('-').pop()).join(',')}]`)
// 			.join('  ');
// 		console.log('  ' + blackEntries);
// 	}
//
// 	console.log(`\nTurn: ${gungi.turn()}, Move #: ${gungi.moveNumber()}`);
// 	console.log('='.repeat(70));
// 	console.log('Press ENTER to continue...');
// }
//
// async function playGame() {
// 	const gungi = new Gungi(ADVANCED_POSITION);
// 	let moveCount = 0;
//
// 	console.log('Starting random Gungi game with ID tracking...\n');
//
// 	while (!gungi.isGameOver() && moveCount < 500) { // Limit moves to prevent infinite games
// 		const moves = gungi.moves();
// 		const move = moves[Math.floor(Math.random() * moves.length)];
//
// 		const moveResult = gungi.move(move);
// 		moveCount++;
//
// 		printText(gungi.ascii());
// 		printIdInfo(gungi, moveResult.san); // Use the SAN from the move result
//
// 		// Wait for user to press Enter
// 		await waitForEnter();
// 	}
//
// 	console.log('\n' + '='.repeat(50));
// 	console.log('GAME OVER!');
// 	console.log('Final FEN: ' + gungi.fen());
// 	console.log('\nGame PGN:');
// 	console.log(gungi.pgn());
//
// 	// Show final registry state
// 	console.log('\nFinal ID Registry State:');
// 	const registryState = gungi.getIdRegistryState();
// 	console.log('Total pieces tracked:', registryState.pieceIdMap.size);
// 	console.log('Total hand pieces:', Array.from(registryState.handIdMap.values()).reduce((sum, ids) => sum + ids.length, 0));
// }
//
// // Run the game
// playGame().catch(console.error);
