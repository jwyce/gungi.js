import { describe, expect, test } from 'bun:test';
import { Gungi } from '../src/gungi/gungi';

describe('Game Ending Detection', () => {
	describe('Checkmate', () => {
		test('should detect checkmate when in check with no escaping move', () => {
			const gungi = new Gungi(
				'3img3/1ra1|n:G|1as1/d1fwdwf2/9/8d/9/D1FWDWF1D/1SA1N1AR1/4MI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			expect(gungi.isCheckmate()).toBe(true);
			expect(gungi.inCheck()).toBe(true);
			expect(gungi.isGameOver()).toBe(true);
		});

		test('should not detect checkmate when in check but has escaping move', () => {
			const gungi = new Gungi(
				'3img3/1ra1N1as1/d1fw2f1d/4dw3/9/9/D1FWDWF1D/1SA3AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			expect(gungi.isCheckmate()).toBe(false);
			expect(gungi.inCheck()).toBe(true);
			expect(gungi.moves().length).toBeGreaterThan(0);
		});

		test('should not detect checkmate when not in check', () => {
			const gungi = new Gungi(
				'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1'
			);
			expect(gungi.isCheckmate()).toBe(false);
			expect(gungi.inCheck()).toBe(false);
		});
	});

	describe('Stalemate', () => {
		test('should not detect stalemate when player has safe moves', () => {
			const gungi = new Gungi(
				'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1'
			);
			expect(gungi.isStalemate()).toBe(false);
			expect(gungi.moves().length).toBeGreaterThan(0);
		});

		test('should not detect stalemate when in check', () => {
			const gungi = new Gungi(
				'3img3/1ra1N1as1/d1fw2f1d/4dw3/9/9/D1FWDWF1D/1SA3AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			expect(gungi.inCheck()).toBe(true);
			expect(gungi.isStalemate()).toBe(false);
		});

		test('should return false for isStalemate in normal position', () => {
			const gungi = new Gungi(
				'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 1'
			);
			expect(gungi.isStalemate()).toBe(false);
		});
	});

	describe('Insufficient Material', () => {
		test('should detect insufficient material with 2 non-adjacent marshals', () => {
			const gungi = new Gungi('m8/9/9/9/9/9/9/9/8M -/- w 3 - 1');
			expect(gungi.isInsufficientMaterial()).toBe(true);
			expect(gungi.isDraw()).toBe(true);
			expect(gungi.isGameOver()).toBe(true);
		});

		test('should not detect insufficient material when marshals are adjacent', () => {
			const gungi = new Gungi('mM7/9/9/9/9/9/9/9/9 -/- w 3 - 1');
			expect(gungi.isInsufficientMaterial()).toBe(false);
		});

		test('should not detect insufficient material when marshals are diagonally adjacent', () => {
			const gungi = new Gungi('m8/1M7/9/9/9/9/9/9/9 -/- w 3 - 1');
			expect(gungi.isInsufficientMaterial()).toBe(false);
		});

		test('should not detect insufficient material when other pieces exist', () => {
			const gungi = new Gungi('m8/9/9/9/9/9/9/9/8M D1/d1 w 3 - 1');
			expect(gungi.isInsufficientMaterial()).toBe(false);
		});

		test('should not detect insufficient material with only 1 marshal', () => {
			const gungi = new Gungi('m8/9/9/9/9/9/9/9/9 -/- w 3 - 1');
			expect(gungi.isInsufficientMaterial()).toBe(false);
		});

		test('should not detect insufficient material with 3+ marshals', () => {
			const gungi = new Gungi('mMm6/9/9/9/9/9/9/9/9 -/- w 3 - 1');
			expect(gungi.isInsufficientMaterial()).toBe(false);
		});
	});

	describe('Draft Phase', () => {
		test('should return false for isCheckmate during draft', () => {
			const gungi = new Gungi(
				'9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 2 wb 1'
			);
			expect(gungi.inDraft()).toBe(true);
			expect(gungi.isCheckmate()).toBe(false);
		});

		test('should return false for isStalemate during draft', () => {
			const gungi = new Gungi(
				'9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 2 wb 1'
			);
			expect(gungi.inDraft()).toBe(true);
			expect(gungi.isStalemate()).toBe(false);
		});

		test('should return false for isInsufficientMaterial during draft', () => {
			const gungi = new Gungi(
				'9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 2 wb 1'
			);
			expect(gungi.inDraft()).toBe(true);
			expect(gungi.isInsufficientMaterial()).toBe(false);
		});

		test('should return false for isGameOver during draft', () => {
			const gungi = new Gungi(
				'9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 2 wb 1'
			);
			expect(gungi.inDraft()).toBe(true);
			expect(gungi.isGameOver()).toBe(false);
		});
	});

	describe('Marshal Captured', () => {
		test('should return true for isGameOver when marshal is captured', () => {
			const gungi = new Gungi(
				'1|g:N|2|W:N|Ad1f/7r1/1nd2Adfr/2|c:G|j2K2/6s1D/1w|W:T|6/2F4J|F:D|/i8/2|S:w||R:M|3C1 -/- b 3 - 164'
			);
			expect(gungi.isGameOver()).toBe(true);
		});

		test('should return false for isCheckmate when marshal is captured', () => {
			const gungi = new Gungi(
				'1|g:N|2|W:N|Ad1f/7r1/1nd2Adfr/2|c:G|j2K2/6s1D/1w|W:T|6/2F4J|F:D|/i8/2|S:w||R:M|3C1 -/- b 3 - 164'
			);
			expect(gungi.isCheckmate()).toBe(false);
		});

		test('should return false for isStalemate when marshal is captured', () => {
			const gungi = new Gungi(
				'1|g:N|2|W:N|Ad1f/7r1/1nd2Adfr/2|c:G|j2K2/6s1D/1w|W:T|6/2F4J|F:D|/i8/2|S:w||R:M|3C1 -/- b 3 - 164'
			);
			expect(gungi.isStalemate()).toBe(false);
		});
	});

	describe('Gungi-specific Rules', () => {
		test('should allow moves while in check', () => {
			const gungi = new Gungi(
				'3img3/1ra1N1as1/d1fw2f1d/4dw3/9/9/D1FWDWF1D/1SA3AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			expect(gungi.inCheck()).toBe(true);
			expect(gungi.moves().length).toBeGreaterThan(0);
		});

		test('should allow moving into check', () => {
			const gungi = new Gungi(
				'3img3/1ra1N1as1/d1fw2f1d/4dw3/9/9/D1FWDWF1D/1SA3AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			const moves = gungi.moves();
			expect(moves.length).toBeGreaterThan(0);
		});
	});

	describe('Game Over Integration', () => {
		test('should return true for isGameOver when checkmate', () => {
			const gungi = new Gungi(
				'3img3/1ra1|n:G|1as1/d1fwdwf2/9/8d/9/D1FWDWF1D/1SA1N1AR1/4MI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			expect(gungi.isGameOver()).toBe(true);
		});

		test('should return true for isGameOver when insufficient material', () => {
			const gungi = new Gungi('m8/9/9/9/9/9/9/9/8M -/- w 3 - 1');
			expect(gungi.isGameOver()).toBe(true);
		});

		test('should return false for isGameOver in normal position', () => {
			const gungi = new Gungi(
				'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1'
			);
			expect(gungi.isGameOver()).toBe(false);
		});
	});

	describe('Draw Detection', () => {
		test('should return true for isDraw when insufficient material', () => {
			const gungi = new Gungi('m8/9/9/9/9/9/9/9/8M -/- w 3 - 1');
			expect(gungi.isDraw()).toBe(true);
		});

		test('should return false for isDraw in normal position', () => {
			const gungi = new Gungi(
				'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1'
			);
			expect(gungi.isDraw()).toBe(false);
		});

		test('should return false for isDraw when checkmate', () => {
			const gungi = new Gungi(
				'3img3/1ra1|n:G|1as1/d1fwdwf2/9/8d/9/D1FWDWF1D/1SA1N1AR1/4MI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 3'
			);
			expect(gungi.isDraw()).toBe(false);
		});
	});
});
