import { describe, expect, it } from 'vitest';
import { Gungi } from '../src/gungi/gungi';

describe('Game Ending Detection', () => {
	describe('Checkmate', () => {
		it('should detect checkmate when in check with no escaping move', () => {
			const gungi = new Gungi(
				'3img3/1ra1|n:G|1as1/d1fwdwf2/9/8d/9/D1FWDWF1D/1SA1N1AR1/4MI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			expect(gungi.isCheckmate()).toBe(true);
			expect(gungi.inCheck()).toBe(true);
			expect(gungi.isGameOver()).toBe(true);
		});

		it('should not detect checkmate when in check but has escaping move', () => {
			const gungi = new Gungi(
				'3img3/1ra1N1as1/d1fw2f1d/4dw3/9/9/D1FWDWF1D/1SA3AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			expect(gungi.isCheckmate()).toBe(false);
			expect(gungi.inCheck()).toBe(true);
			expect(gungi.moves().length).toBeGreaterThan(0);
		});

		it('should not detect checkmate when not in check', () => {
			const gungi = new Gungi(
				'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1'
			);
			expect(gungi.isCheckmate()).toBe(false);
			expect(gungi.inCheck()).toBe(false);
		});
	});

	describe('Stalemate', () => {
		it('should detect stalemate when not in check but all moves lead to check', () => {
			const gungi = new Gungi('8m/9/7DD/7C1/9/9/9/9/M8 -/- b 3 - 1');
			expect(gungi.inCheck()).toBe(false);
			expect(gungi.isStalemate()).toBe(true);
			expect(gungi.isDraw()).toBe(true);
			expect(gungi.isGameOver()).toBe(true);
			expect(gungi.moves().length).toBe(0);
		});

		it('should not detect stalemate when player has safe moves', () => {
			const gungi = new Gungi(
				'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1'
			);
			expect(gungi.isStalemate()).toBe(false);
			expect(gungi.moves().length).toBeGreaterThan(0);
		});

		it('should not detect stalemate when in check', () => {
			const gungi = new Gungi(
				'3img3/1ra1N1as1/d1fw2f1d/4dw3/9/9/D1FWDWF1D/1SA3AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			expect(gungi.inCheck()).toBe(true);
			expect(gungi.isStalemate()).toBe(false);
		});

		it('should return false for isStalemate in normal position', () => {
			const gungi = new Gungi(
				'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 1'
			);
			expect(gungi.isStalemate()).toBe(false);
		});
	});

	describe('Insufficient Material', () => {
		it('should detect insufficient material with 2 non-adjacent marshals', () => {
			const gungi = new Gungi('m8/9/9/9/9/9/9/9/8M -/- w 3 - 1');
			expect(gungi.isInsufficientMaterial()).toBe(true);
			expect(gungi.isDraw()).toBe(true);
			expect(gungi.isGameOver()).toBe(true);
		});

		it('should not detect insufficient material when marshals are adjacent', () => {
			const gungi = new Gungi('mM7/9/9/9/9/9/9/9/9 -/- w 3 - 1');
			expect(gungi.isInsufficientMaterial()).toBe(false);
		});

		it('should not detect insufficient material when marshals are diagonally adjacent', () => {
			const gungi = new Gungi('m8/1M7/9/9/9/9/9/9/9 -/- w 3 - 1');
			expect(gungi.isInsufficientMaterial()).toBe(false);
		});

		it('should not detect insufficient material when other pieces exist', () => {
			const gungi = new Gungi('m8/9/9/9/9/9/9/9/8M D1/d1 w 3 - 1');
			expect(gungi.isInsufficientMaterial()).toBe(false);
		});

		it('should not detect insufficient material with only 1 marshal', () => {
			const gungi = new Gungi('m8/9/9/9/9/9/9/9/9 -/- w 3 - 1');
			expect(gungi.isInsufficientMaterial()).toBe(false);
		});

		it('should not detect insufficient material with 3+ marshals', () => {
			const gungi = new Gungi('mMm6/9/9/9/9/9/9/9/9 -/- w 3 - 1');
			expect(gungi.isInsufficientMaterial()).toBe(false);
		});
	});

	describe('Draft Phase', () => {
		it('should return false for isCheckmate during draft', () => {
			const gungi = new Gungi(
				'9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 2 wb 1'
			);
			expect(gungi.inDraft()).toBe(true);
			expect(gungi.isCheckmate()).toBe(false);
		});

		it('should return false for isStalemate during draft', () => {
			const gungi = new Gungi(
				'9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 2 wb 1'
			);
			expect(gungi.inDraft()).toBe(true);
			expect(gungi.isStalemate()).toBe(false);
		});

		it('should return false for isInsufficientMaterial during draft', () => {
			const gungi = new Gungi(
				'9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 2 wb 1'
			);
			expect(gungi.inDraft()).toBe(true);
			expect(gungi.isInsufficientMaterial()).toBe(false);
		});

		it('should return false for isGameOver during draft', () => {
			const gungi = new Gungi(
				'9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 2 wb 1'
			);
			expect(gungi.inDraft()).toBe(true);
			expect(gungi.isGameOver()).toBe(false);
		});
	});

	describe('Marshal Captured', () => {
		it('should return true for isGameOver when marshal is captured', () => {
			const gungi = new Gungi(
				'1|g:N|2|W:N|Ad1f/7r1/1nd2Adfr/2|c:G|j2K2/6s1D/1w|W:T|6/2F4J|F:D|/i8/2|S:w||R:M|3C1 -/- b 3 - 164'
			);
			expect(gungi.isGameOver()).toBe(true);
		});

		it('should return false for isCheckmate when marshal is captured', () => {
			const gungi = new Gungi(
				'1|g:N|2|W:N|Ad1f/7r1/1nd2Adfr/2|c:G|j2K2/6s1D/1w|W:T|6/2F4J|F:D|/i8/2|S:w||R:M|3C1 -/- b 3 - 164'
			);
			expect(gungi.isCheckmate()).toBe(false);
		});

		it('should return false for isStalemate when marshal is captured', () => {
			const gungi = new Gungi(
				'1|g:N|2|W:N|Ad1f/7r1/1nd2Adfr/2|c:G|j2K2/6s1D/1w|W:T|6/2F4J|F:D|/i8/2|S:w||R:M|3C1 -/- b 3 - 164'
			);
			expect(gungi.isStalemate()).toBe(false);
		});
	});

	describe('Gungi-specific Rules', () => {
		it('should allow moves while in check', () => {
			const gungi = new Gungi(
				'3img3/1ra1N1as1/d1fw2f1d/4dw3/9/9/D1FWDWF1D/1SA3AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			expect(gungi.inCheck()).toBe(true);
			expect(gungi.moves().length).toBeGreaterThan(0);
		});

		it('should allow moving into check', () => {
			const gungi = new Gungi(
				'3img3/1ra1N1as1/d1fw2f1d/4dw3/9/9/D1FWDWF1D/1SA3AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			const moves = gungi.moves();
			expect(moves.length).toBeGreaterThan(0);
		});
	});

	describe('Game Over Integration', () => {
		it('should return true for isGameOver when checkmate', () => {
			const gungi = new Gungi(
				'3img3/1ra1|n:G|1as1/d1fwdwf2/9/8d/9/D1FWDWF1D/1SA1N1AR1/4MI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			expect(gungi.isGameOver()).toBe(true);
		});

		it('should return true for isGameOver when insufficient material', () => {
			const gungi = new Gungi('m8/9/9/9/9/9/9/9/8M -/- w 3 - 1');
			expect(gungi.isGameOver()).toBe(true);
		});

		it('should return false for isGameOver in normal position', () => {
			const gungi = new Gungi(
				'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1'
			);
			expect(gungi.isGameOver()).toBe(false);
		});
	});

	describe('Draw Detection', () => {
		it('should return true for isDraw when insufficient material', () => {
			const gungi = new Gungi('m8/9/9/9/9/9/9/9/8M -/- w 3 - 1');
			expect(gungi.isDraw()).toBe(true);
		});

		it('should return false for isDraw in normal position', () => {
			const gungi = new Gungi(
				'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1'
			);
			expect(gungi.isDraw()).toBe(false);
		});

		it('should return false for isDraw when checkmate', () => {
			const gungi = new Gungi(
				'3img3/1ra1|n:G|1as1/d1fwdwf2/9/8d/9/D1FWDWF1D/1SA1N1AR1/4MI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			expect(gungi.isDraw()).toBe(false);
		});
	});

	describe('Draft Phase', () => {
		it('should only generate 終 moves when player has 1 piece left in hand during draft', () => {
			const gungi = new Gungi(
				'9/9/9/9/9/9/9/9/4M4 D1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 3 w 1'
			);
			const moves = gungi.moves() as string[];

			expect(moves.length).toBeGreaterThan(0);
			expect(moves.every((m) => m.endsWith('終'))).toBe(true);
		});

		it('should generate both regular and 終 moves when player has 2+ pieces in hand during draft', () => {
			const gungi = new Gungi(
				'9/9/9/9/9/9/9/9/4M4 D2/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 3 w 1'
			);
			const moves = gungi.moves() as string[];

			const regularMoves = moves.filter((m) => !m.endsWith('終'));
			const draftEndMoves = moves.filter((m) => m.endsWith('終'));

			expect(regularMoves.length).toBeGreaterThan(0);
			expect(draftEndMoves.length).toBeGreaterThan(0);
		});
	});
});
