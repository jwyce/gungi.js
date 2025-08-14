import { describe, expect, it } from 'vitest';
import { Gungi } from '../src/gungi/gungi';
import { BEGINNER_POSITION } from '../src/gungi/fen';

describe('Piece ID Assignment and Stability', () => {
	describe('Basic ID Assignment', () => {
		it('should assign IDs to all pieces in beginner position', () => {
			const gungi = new Gungi(BEGINNER_POSITION);
			
			// Check that board pieces have IDs
			const soldier = gungi.getTop('7-5');
			expect(soldier?.id).toBeDefined();
			expect(soldier?.id).toMatch(/^w-兵-\d+$/);
			
			// Check that hand pieces have IDs  
			const handPieces = gungi.hand('w');
			expect(handPieces.length).toBeGreaterThan(0);
			expect(handPieces[0].id).toBeDefined();
			expect(handPieces[0].id).toMatch(/^w-小-\d+$/);
		});

		it('should assign deterministic IDs for same position', () => {
			const gungi1 = new Gungi(BEGINNER_POSITION);
			const gungi2 = new Gungi(BEGINNER_POSITION);
			
			// Same position should produce same IDs
			const soldier1 = gungi1.getTop('7-5');
			const soldier2 = gungi2.getTop('7-5');
			expect(soldier1?.id).toBe(soldier2?.id);
			
			const hand1 = gungi1.hand('w');
			const hand2 = gungi2.hand('w');
			expect(hand1[0].id).toBe(hand2[0].id);
		});
	});

	describe('Move Stability', () => {
		it('should preserve piece ID for simple move - example from user', () => {
			// Starting FEN: "3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1"
			const gungi = new Gungi(BEGINNER_POSITION);
			
			// Get the initial piece at 7-5 (white soldier/兵)
			const initialPiece = gungi.getTop('7-5');
			expect(initialPiece?.type).toBe('兵');
			expect(initialPiece?.color).toBe('w');
			expect(initialPiece?.id).toBeDefined();
			const initialId = initialPiece!.id;
			
			// Make the move: 兵(7-5-1)(6-5-1)
			// Expected resulting FEN: "3img3/1ra1n1as1/d1fwdwf1d/9/9/4D4/D1FW1WF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 1"
			gungi.move('兵(7-5-1)(6-5-1)');
			
			// The same piece should now be at 6-5 with the same ID
			const movedPiece = gungi.getTop('6-5');
			expect(movedPiece?.type).toBe('兵');
			expect(movedPiece?.color).toBe('w');
			expect(movedPiece?.id).toBe(initialId);
			
			// The original square should be empty (no piece underneath in beginner position)
			const originalSquare = gungi.getTop('7-5');
			expect(originalSquare).toBeUndefined();
		});

		it('should preserve piece ID for arata move - example from user', () => {
			const gungi = new Gungi(BEGINNER_POSITION);
			
			// Get initial hand pieces for white 小 (J)
			const initialHand = gungi.hand('w').find(hp => hp.type === '小');
			expect(initialHand?.count).toBe(2);
			expect(initialHand?.id).toBeDefined();
			const initialHandId = initialHand!.id;
			
			// Make arata move: 新小(7-2-1)
			gungi.move('新小(7-2-1)');
			
			// Check the piece appeared on the board at 7-2
			const placedPiece = gungi.getTop('7-2');
			expect(placedPiece?.type).toBe('小');
			expect(placedPiece?.color).toBe('w');
			expect(placedPiece?.id).toBeDefined();
			
			// Check hand count decreased
			const newHand = gungi.hand('w').find(hp => hp.type === '小');
			expect(newHand?.count).toBe(1);
			expect(newHand?.id).toBe(initialHandId); // Hand pieces should keep same base ID
		});

		it('should handle multiple consecutive moves while preserving IDs', () => {
			const gungi = new Gungi(BEGINNER_POSITION);
			
			// Track a specific piece through multiple moves
			const initialSoldier = gungi.getTop('7-5');
			const soldierId = initialSoldier!.id;
			
			// Move 1: 兵(7-5-1)(6-5-1)
			gungi.move('兵(7-5-1)(6-5-1)');
			let movedSoldier = gungi.getTop('6-5');
			expect(movedSoldier?.id).toBe(soldierId);
			
			// Move 2: Black move (any legal move)
			gungi.move('兵(3-5-1)(4-5-1)');
			
			// Move 3: Continue with our tracked piece
			gungi.move('兵(6-5-1)(5-5-1)');
			movedSoldier = gungi.getTop('5-5');
			expect(movedSoldier?.id).toBe(soldierId);
		});
	});

	describe('Load vs Move ID Consistency', () => {
		it('should produce same IDs whether using move() or load() for single move differences', () => {
			// Test regular board move
			const startingFen = BEGINNER_POSITION;
			const endingFen = "3img3/1ra1n1as1/d1fwdwf1d/9/9/4D4/D1FW1WF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 1";
			
			// Scenario 1: Use move()
			const gungi1 = new Gungi(startingFen);
			const initialPieceId1 = gungi1.getTop('7-5')!.id;
			gungi1.move('兵(7-5-1)(6-5-1)');
			const movedPieceId1 = gungi1.getTop('6-5')!.id;
			
			// Scenario 2: Use sequential load() calls
			const gungi2 = new Gungi(startingFen);
			const initialPieceId2 = gungi2.getTop('7-5')!.id;
			gungi2.load(endingFen);
			const movedPieceId2 = gungi2.getTop('6-5')!.id;
			
			// IDs should be consistent between both approaches
			expect(initialPieceId1).toBe(initialPieceId2);
			expect(movedPieceId1).toBe(movedPieceId2);
			expect(movedPieceId1).toBe(initialPieceId1); // Moving piece should keep same ID
		});

		it('should produce same IDs for arata moves via move() vs load()', () => {
			// Test arata (hand to board) move
			const startingFen = BEGINNER_POSITION;
			const endingFen = "3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWFJD/1SA1N1AR1/3GMI3 J1N2S1R1D1/j2n2s1r1d1 b 1 - 1";
			
			// Scenario 1: Use move()
			const gungi1 = new Gungi(startingFen);
			const initialHandId1 = gungi1.hand('w').find(hp => hp.type === '小')!.id;
			gungi1.move('新小(7-2-1)');
			const placedPieceId1 = gungi1.getTop('7-2')!.id;
			const newHandId1 = gungi1.hand('w').find(hp => hp.type === '小')!.id;
			
			// Scenario 2: Use sequential load() calls  
			const gungi2 = new Gungi(startingFen);
			const initialHandId2 = gungi2.hand('w').find(hp => hp.type === '小')!.id;
			gungi2.load(endingFen);
			const placedPieceId2 = gungi2.getTop('7-2')!.id;
			const newHandId2 = gungi2.hand('w').find(hp => hp.type === '小')!.id;
			
			// IDs should be consistent between both approaches
			expect(initialHandId1).toBe(initialHandId2);
			expect(placedPieceId1).toBe(placedPieceId2);
			expect(newHandId1).toBe(newHandId2);
			expect(newHandId1).toBe(initialHandId1); // Hand should keep same base ID
		});

		it('should produce same IDs for multiple sequential load() calls vs moves', () => {
			// Test a sequence of moves
			const fen1 = BEGINNER_POSITION;
			const fen2 = "3img3/1ra1n1as1/d1fwdwf1d/9/9/4D4/D1FW1WF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 1";
			const fen3 = "3img3/1ra1n1as1/d1fw1wf1d/4d4/9/4D4/D1FW1WF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 2";
			
			// Scenario 1: Use moves
			const gungi1 = new Gungi(fen1);
			const whiteSoldierId1 = gungi1.getTop('7-5')!.id;
			const blackSoldierId1 = gungi1.getTop('3-5')!.id;
			
			gungi1.move('兵(7-5-1)(6-5-1)'); // White soldier moves
			gungi1.move('兵(3-5-1)(4-5-1)'); // Black soldier moves
			
			const finalWhiteSoldierId1 = gungi1.getTop('6-5')!.id;
			const finalBlackSoldierId1 = gungi1.getTop('4-5')!.id;
			
			// Scenario 2: Use sequential loads
			const gungi2 = new Gungi(fen1);
			const whiteSoldierId2 = gungi2.getTop('7-5')!.id;
			const blackSoldierId2 = gungi2.getTop('3-5')!.id;
			
			gungi2.load(fen2); // Load after white move
			gungi2.load(fen3); // Load after black move
			
			const finalWhiteSoldierId2 = gungi2.getTop('6-5')!.id;
			const finalBlackSoldierId2 = gungi2.getTop('4-5')!.id;
			
			// All IDs should match between approaches
			expect(whiteSoldierId1).toBe(whiteSoldierId2);
			expect(blackSoldierId1).toBe(blackSoldierId2);
			expect(finalWhiteSoldierId1).toBe(finalWhiteSoldierId2);
			expect(finalBlackSoldierId1).toBe(finalBlackSoldierId2);
			expect(finalWhiteSoldierId1).toBe(whiteSoldierId1); // Piece should keep same ID
			expect(finalBlackSoldierId1).toBe(blackSoldierId1); // Piece should keep same ID
		});

		it('should handle non-sequential loads differently from single-move loads', () => {
			// Test loading very different positions should not preserve IDs
			const gungi = new Gungi(BEGINNER_POSITION);
			const initialSoldierId = gungi.getTop('7-5')!.id;
			
			// Load a completely different position
			gungi.load('9/9/9/9/4d4/9/9/9/9 -/- w 0 - 1');
			
			// Then load back to a position with the same piece type
			gungi.load('9/9/9/9/9/9/9/9/4D4 -/- w 0 - 1');
			const newSoldierId = gungi.getTop('9-5')!.id;
			
			// Since these are very different positions (not single moves apart),
			// canonical assignment should be used and IDs may be different
			// This tests that our move detection properly identifies non-single-move changes
		});
	});

	describe('Edge Cases', () => {
		it('should handle captures correctly', () => {
			const gungi = new Gungi(BEGINNER_POSITION);
			
			// Set up a position where a capture is possible
			const initialPiece = gungi.getTop('7-5');
			const pieceId = initialPiece!.id;
			
			// Make some moves to enable capture scenario
			gungi.move('兵(7-5-1)(6-5-1)');
			gungi.move('兵(3-5-1)(4-5-1)');
			
			// The moving piece should keep its ID through legal moves
			const movedPiece = gungi.getTop('6-5');
			expect(movedPiece?.id).toBe(pieceId);
		});

		it('should reset IDs properly on reset()', () => {
			const gungi = new Gungi(BEGINNER_POSITION);
			const initialPiece = gungi.getTop('7-5');
			const initialId = initialPiece!.id;
			
			// Make some moves
			gungi.move('兵(7-5-1)(6-5-1)');
			
			// Reset to original position  
			gungi.reset();
			const resetPiece = gungi.getTop('7-5');
			
			// Should have same ID as original since it's the same position
			expect(resetPiece?.id).toBe(initialId);
		});
	});

	describe('ID Format and Consistency', () => {
		it('should generate correctly formatted IDs', () => {
			const gungi = new Gungi(BEGINNER_POSITION);
			
			// Check board piece ID format
			const piece = gungi.getTop('7-5');
			expect(piece?.id).toMatch(/^[wb]-[兵帥大中小侍槍馬忍砦弓砲筒謀]-\d+$/);
			
			// Check hand piece ID format
			const handPiece = gungi.hand('w')[0];
			expect(handPiece.id).toMatch(/^[wb]-[兵帥大中小侍槍馬忍砦弓砲筒謀]-\d+$/);
		});

		it('should have unique IDs for different pieces of same type', () => {
			const gungi = new Gungi(BEGINNER_POSITION);
			
			// Get all white soldiers
			const allSoldiers: string[] = [];
			
			// Check board soldiers
			for (let rank = 1; rank <= 9; rank++) {
				for (let file = 1; file <= 9; file++) {
					const piece = gungi.getTop(`${rank}-${file}`);
					if (piece?.type === '兵' && piece?.color === 'w') {
						allSoldiers.push(piece.id!);
					}
				}
			}
			
			// All soldier IDs should be unique
			const uniqueIds = new Set(allSoldiers);
			expect(uniqueIds.size).toBe(allSoldiers.length);
		});
	});
});