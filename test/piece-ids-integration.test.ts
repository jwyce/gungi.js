import { describe, expect, it } from 'vitest';
import { ADVANCED_POSITION, BEGINNER_POSITION } from '../src/gungi/fen';
import { Gungi } from '../src/gungi/gungi';
import { HandPiece, Piece } from '../src/gungi/utils';

describe('Piece ID Integration Tests', () => {
	function getAllPieceIds(gungi: Gungi): {
		boardIds: string[];
		handIds: string[];
	} {
		const boardIds: string[] = [];
		const handIds: string[] = [];

		// Collect board piece IDs
		for (let rank = 1; rank <= 9; rank++) {
			for (let file = 1; file <= 9; file++) {
				const tower = gungi.get(`${rank}-${file}`);
				if (tower) {
					for (const piece of tower) {
						if (piece?.id) {
							boardIds.push(piece.id);
						}
					}
				}
			}
		}

		// Collect hand piece IDs
		const allHandPieces = gungi.hand();
		for (const handPiece of allHandPieces) {
			if (handPiece.id) {
				handIds.push(handPiece.id);
			}
		}

		return { boardIds, handIds };
	}

	function validateIdFormat(id: string, mode: number): boolean {
		// Format should be: mode-color-type-number
		const pattern = new RegExp(
			`^${mode}-[wb]-[兵帥大中小侍槍馬忍砦弓砲筒謀]-\\d+$`
		);
		return pattern.test(id);
	}

	function validateUniqueIds(boardIds: string[], handIds: string[]): boolean {
		const allIds = [...boardIds, ...handIds];
		const uniqueIds = new Set(allIds);
		return uniqueIds.size === allIds.length;
	}

	function trackPiecePositions(
		gungi: Gungi
	): Map<
		string,
		{ square?: string; inHand: boolean; type: string; color: string }
	> {
		const pieceMap = new Map<
			string,
			{ square?: string; inHand: boolean; type: string; color: string }
		>();

		// Track board pieces
		for (let rank = 1; rank <= 9; rank++) {
			for (let file = 1; file <= 9; file++) {
				const square = `${rank}-${file}`;
				const tower = gungi.get(square);
				if (tower) {
					for (const piece of tower) {
						if (piece?.id) {
							pieceMap.set(piece.id, {
								square,
								inHand: false,
								type: piece.type,
								color: piece.color,
							});
						}
					}
				}
			}
		}

		// Track hand pieces
		const allHandPieces = gungi.hand();
		for (const handPiece of allHandPieces) {
			if (handPiece.id) {
				pieceMap.set(handPiece.id, {
					inHand: true,
					type: handPiece.type,
					color: handPiece.color,
				});
			}
		}

		return pieceMap;
	}

	function getRandomMove(gungi: Gungi): string | null {
		const moves = gungi.moves() as string[];
		if (moves.length === 0) return null;
		return moves[Math.floor(Math.random() * moves.length)];
	}

	it('should maintain piece ID invariants throughout a short advanced mode game', () => {
		const gungi = new Gungi(ADVANCED_POSITION);
		const maxMoves = 500; // Keep it short to focus on core functionality

		// Validate initial state
		let { boardIds, handIds } = getAllPieceIds(gungi);
		expect(validateUniqueIds(boardIds, handIds)).toBe(true);

		// Play some moves and validate basic invariants
		for (let i = 0; i < maxMoves && !gungi.isGameOver(); i++) {
			const move = getRandomMove(gungi);
			if (!move) break;

			const beforeIds = getAllPieceIds(gungi);
			gungi.move(move);
			const afterIds = getAllPieceIds(gungi);

			// Invariant 1: All IDs should have correct format
			const allAfterIds = [...afterIds.boardIds, ...afterIds.handIds];
			for (const id of allAfterIds) {
				expect(
					validateIdFormat(id, 3),
					`Invalid ID format: ${id} after move: ${move}`
				).toBe(true);
			}

			// Invariant 2: All IDs should be unique
			expect(
				validateUniqueIds(afterIds.boardIds, afterIds.handIds),
				`Duplicate IDs found after move: ${move}`
			).toBe(true);
		}
	});

	it('should handle arata moves correctly in beginner mode', () => {
		const gungi = new Gungi(BEGINNER_POSITION);

		// In beginner mode, some pieces start in hand
		const initialHandPieces = gungi.hand();
		expect(initialHandPieces.length).toBeGreaterThan(0);

		// Track a specific hand piece - use major general (小) since it's in beginner mode hand
		const majorGeneralHand = initialHandPieces.find(
			(hp) => hp.type === '小' && hp.color === 'w'
		);
		expect(majorGeneralHand).toBeDefined();
		expect(majorGeneralHand!.id).toBeDefined();
		const originalHandId = majorGeneralHand!.id!;
		const originalCount = majorGeneralHand!.count;

		// Make an arata move with this piece
		const arataMoves = gungi.moves().filter((move) => move.startsWith('新小'));
		expect(arataMoves.length).toBeGreaterThan(0);

		gungi.move(arataMoves[0]);

		// Check that the hand piece count decreased but kept the same ID
		const newHandPieces = gungi.hand();
		const newMajorGeneralHand = newHandPieces.find(
			(hp) => hp.type === '小' && hp.color === 'w'
		);

		if (originalCount > 1) {
			// Should still have some in hand
			expect(newMajorGeneralHand).toBeDefined();
			expect(newMajorGeneralHand!.count).toBe(originalCount - 1);
			expect(newMajorGeneralHand!.id).toBe(originalHandId); // Same ID preserved
		} else {
			// All pieces of this type were placed
			expect(newMajorGeneralHand).toBeUndefined();
		}

		// Check that a new piece appeared on the board
		let placedPiece: Piece | undefined;
		for (let rank = 1; rank <= 9; rank++) {
			for (let file = 1; file <= 9; file++) {
				const piece = gungi.getTop(`${rank}-${file}`);
				if (piece && piece.type === '小' && piece.color === 'w') {
					placedPiece = piece;
					break;
				}
			}
			if (placedPiece) break;
		}

		expect(placedPiece).toBeDefined();
		expect(placedPiece!.id).toBeDefined();
		expect(placedPiece!.id).not.toBe(originalHandId); // Board piece should have different ID
		expect(validateIdFormat(placedPiece!.id!, 1)).toBe(true); // Beginner mode = 1

		// Ensure no duplicate IDs
		const allIds = getAllPieceIds(gungi);
		expect(validateUniqueIds(allIds.boardIds, allIds.handIds)).toBe(true);
	});

	it('should handle multiple consecutive arata moves without ID conflicts', () => {
		const gungi = new Gungi(ADVANCED_POSITION);
		const movesToMake = 10;

		for (let i = 0; i < movesToMake; i++) {
			if (gungi.isGameOver()) break;

			const move = getRandomMove(gungi);
			if (!move) break;

			const beforeIds = getAllPieceIds(gungi);
			gungi.move(move);
			const afterIds = getAllPieceIds(gungi);

			// Validate invariants after each move
			const allAfterIds = [...afterIds.boardIds, ...afterIds.handIds];
			for (const id of allAfterIds) {
				expect(
					validateIdFormat(id, 3),
					`Invalid ID format: ${id} after move: ${move}`
				).toBe(true);
			}

			expect(
				validateUniqueIds(afterIds.boardIds, afterIds.handIds),
				`Duplicate IDs found after move: ${move}`
			).toBe(true);
		}
	});
});
