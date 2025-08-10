import { beforeEach, describe, expect, it } from 'vitest';
import { BEGINNER_POSITION, Gungi, INTRO_POSITION } from '../src/gungi';

describe('ID Tracking', () => {
	let gungi: Gungi;

	beforeEach(() => {
		gungi = new Gungi(INTRO_POSITION);
	});

	it('pieces should have IDs assigned on initialization', () => {
		const board = gungi.getBoardWithIds();

		// Check that board pieces have IDs
		let pieceCount = 0;
		let piecesWithIds = 0;

		for (let rank = 0; rank < 9; rank++) {
			for (let file = 0; file < 9; file++) {
				const tower = board[rank][file];
				if (tower && tower[0]) {
					for (const piece of tower) {
						if (piece) {
							pieceCount++;
							if (piece.id) {
								piecesWithIds++;
							}
						}
					}
				}
			}
		}

		expect(pieceCount).toBeGreaterThan(0);
		expect(piecesWithIds).toBe(pieceCount);
	});

	it('hand pieces should have IDs', () => {
		const handWithIds = gungi.getHandWithIds();

		for (const handPiece of handWithIds) {
			expect(handPiece.ids).toBeDefined();
			expect(handPiece.ids!.length).toBe(handPiece.count);

			// Check ID format
			for (const id of handPiece.ids!) {
				expect(id).toMatch(/^.+-[wb]-\d+$/);
				expect(id.includes(handPiece.type)).toBe(true);
				expect(id.includes(handPiece.color)).toBe(true);
			}
		}
	});

	it('piece IDs should persist after moves', () => {
		// Get initial piece ID
		const initialPiece = gungi.getTop('7-1');
		expect(initialPiece).toBeDefined();
		expect(initialPiece!.id).toBeDefined();
		const initialId = initialPiece!.id!;

		// Make a move with this piece
		gungi.move('兵(7-1-1)(6-1-1)');

		// Check that the same piece now at new location has same ID
		const movedPiece = gungi.getTop('6-1');
		expect(movedPiece).toBeDefined();
		expect(movedPiece!.id).toBe(initialId);

		// Check that old location is empty
		const oldLocation = gungi.getTop('7-1');
		expect(oldLocation).toBeUndefined();
	});

	it('captured pieces should be removed from the game', () => {
		// Set up a position where we can capture
		gungi = new Gungi(BEGINNER_POSITION);

		// Make some moves to set up a capture
		gungi.move('新小(7-5-2)付');
		gungi.move('兵(3-5-1)(4-5-1)');
		gungi.move('新槍(7-4-2)付');
		gungi.move('兵(4-5-1)(5-5-1)');

		// Get the ID of the piece about to be captured
		const pieceToCapture = gungi.getTop('5-5');
		expect(pieceToCapture).toBeDefined();
		expect(pieceToCapture!.id).toBeDefined();
		const capturedPieceId = pieceToCapture!.id!;

		// Capture the piece
		gungi.move('小(7-5-2)取(5-5-1)');

		// Check that the captured piece is no longer anywhere in the game
		const capturedPieceById = gungi.getPieceById(capturedPieceId);
		expect(capturedPieceById).toBeUndefined();

		// Check that the capturing piece is now at the destination
		const capturingPiece = gungi.getTop('5-5');
		expect(capturingPiece).toBeDefined();
		expect(capturingPiece!.type).toBe('小'); // major general
	});

	it('arata moves should use existing hand piece IDs', () => {
		gungi = new Gungi(BEGINNER_POSITION);

		// Get a hand piece ID before arata
		const initialHand = gungi.getHandWithIds('w');
		const majorGeneralPiece = initialHand.find((hp) => hp.type === '小');
		expect(majorGeneralPiece).toBeDefined();
		expect(majorGeneralPiece!.ids).toBeDefined();
		const handPieceId = majorGeneralPiece!.ids![0];

		// Make an arata move
		gungi.move('新小(7-5-2)付');

		// Check that the piece on board has the same ID as the hand piece
		const placedPiece = gungi.getTop('7-5');
		expect(placedPiece).toBeDefined();
		expect(placedPiece!.id).toBe(handPieceId);

		// Check that the hand count decreased and ID was removed
		const updatedHand = gungi.getHandWithIds('w');
		const updatedMajorGeneral = updatedHand.find((hp) => hp.type === '小');
		expect(updatedMajorGeneral!.count).toBe(majorGeneralPiece!.count - 1);
		expect(updatedMajorGeneral!.ids).not.toContain(handPieceId);
	});

	it('piece IDs should be unique', () => {
		const allIds = new Set<string>();

		// Collect all board piece IDs
		const board = gungi.getBoardWithIds();
		for (let rank = 0; rank < 9; rank++) {
			for (let file = 0; file < 9; file++) {
				const tower = board[rank][file];
				if (tower && tower[0]) {
					for (const piece of tower) {
						if (piece && piece.id) {
							expect(allIds.has(piece.id)).toBe(false);
							allIds.add(piece.id);
						}
					}
				}
			}
		}

		// Collect all hand piece IDs
		const hand = gungi.getHandWithIds();
		for (const handPiece of hand) {
			if (handPiece.ids) {
				for (const id of handPiece.ids) {
					expect(allIds.has(id)).toBe(false);
					allIds.add(id);
				}
			}
		}

		expect(allIds.size).toBeGreaterThan(0);
	});

	it('ID format should be correct', () => {
		const board = gungi.getBoardWithIds();

		for (let rank = 0; rank < 9; rank++) {
			for (let file = 0; file < 9; file++) {
				const tower = board[rank][file];
				if (tower && tower[0]) {
					for (const piece of tower) {
						if (piece && piece.id) {
							// ID should be in format: type-color-number
							const parts = piece.id.split('-');
							expect(parts.length).toBe(3);
							expect(parts[0]).toBe(piece.type);
							expect(parts[1]).toBe(piece.color);
							expect(parseInt(parts[2])).toBeGreaterThan(0);
						}
					}
				}
			}
		}
	});

	it('getPieceId method should work correctly', () => {
		const piece = gungi.getTop('7-1');
		expect(piece).toBeDefined();
		expect(piece!.id).toBeDefined();

		const retrievedId = gungi.getPieceId('7-1');
		expect(retrievedId).toBe(piece!.id);

		const retrievedIdWithTier = gungi.getPieceId('7-1', 1);
		expect(retrievedIdWithTier).toBe(piece!.id);
	});

	it('getPieceById method should work correctly', () => {
		const piece = gungi.getTop('7-1');
		expect(piece).toBeDefined();
		expect(piece!.id).toBeDefined();

		const retrievedPiece = gungi.getPieceById(piece!.id!);
		expect(retrievedPiece).toBeDefined();
		expect(retrievedPiece!.id).toBe(piece!.id);
		expect(retrievedPiece!.square).toBe(piece!.square);
		expect(retrievedPiece!.type).toBe(piece!.type);
	});

	it('getHandPieceId method should work correctly', () => {
		gungi = new Gungi(BEGINNER_POSITION);

		const whiteHandPieces = gungi.getHandWithIds('w');
		const majorGeneral = whiteHandPieces.find((hp) => hp.type === '小');
		expect(majorGeneral).toBeDefined();
		expect(majorGeneral!.ids).toBeDefined();
		expect(majorGeneral!.ids!.length).toBeGreaterThan(0);

		const firstId = gungi.getHandPieceId('小', 'w', 0);
		expect(firstId).toBe(majorGeneral!.ids![0]);

		const secondId = gungi.getHandPieceId('小', 'w', 1);
		if (majorGeneral!.ids!.length > 1) {
			expect(secondId).toBe(majorGeneral!.ids![1]);
		} else {
			expect(secondId).toBeUndefined();
		}
	});

	it('should handle multiple moves with complex ID tracking', () => {
		// Test a sequence of moves to ensure IDs remain consistent
		const initialPiece = gungi.getTop('7-1');
		expect(initialPiece!.id).toBeDefined();
		const pieceId = initialPiece!.id!;

		// Move piece multiple times
		gungi.move('兵(7-1-1)(6-1-1)');
		let movedPiece = gungi.getTop('6-1');
		expect(movedPiece!.id).toBe(pieceId);

		gungi.move('侍(3-4-1)(4-4-1)'); // Black move
		gungi.move('兵(6-1-1)(5-1-1)'); // Move same piece again

		movedPiece = gungi.getTop('5-1');
		expect(movedPiece!.id).toBe(pieceId);

		// Verify the piece is no longer at previous locations
		expect(gungi.getTop('7-1')).toBeUndefined();
		expect(gungi.getTop('6-1')).toBeUndefined();
	});
});
