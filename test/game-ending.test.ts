import { describe, expect, it } from 'vitest';
import { Gungi, INTRO_POSITION } from '../src/gungi/gungi';

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

	describe('Fourfold Repetition', () => {
		const expectRepetition = (gungi: Gungi, value: boolean) => {
			expect(gungi.isFourfoldRepetition()).toBe(value);
			expect(gungi.isDraw()).toBe(value);
			expect(gungi.isGameOver()).toBe(value);
		};

		it('should not count the same board with the other side to move as a repeat', () => {
			// White cycles 小 through three squares, black cycles 兵 through two,
			// so the board recurs every 5 or 7 plies with alternating sides to move,
			// but the full position only recurs every 12 plies.
			const gungi = new Gungi('m8/9/8d/9/9/9/J8/9/M8 -/- w 3 - 1');
			const white = [
				'小(7-9-1)(7-8-1)',
				'小(7-8-1)(6-9-1)',
				'小(6-9-1)(7-9-1)',
			];
			const black = ['兵(3-1-1)(4-1-1)', '兵(4-1-1)(3-1-1)'];
			const line = Array.from({ length: 36 }, (_, i) =>
				i % 2 === 0 ? white[(i / 2) % 3] : black[((i - 1) / 2) % 2]
			);

			line.slice(0, 17).forEach((move) => gungi.move(move));
			// The starting board occurs for the 4th time (plies 0, 5, 12, 17),
			// but with black to move at plies 5 and 17.
			expect(gungi.fen().split(' ').slice(0, 3).join(' ')).toBe(
				'm8/9/8d/9/9/9/J8/9/M8 -/- b'
			);
			expectRepetition(gungi, false);

			line.slice(17, 35).forEach((move) => gungi.move(move));
			expectRepetition(gungi, false);

			// The starting position with white to move occurs for the 4th time
			// (plies 0, 12, 24, 36).
			const last = gungi.move(line[35]);
			expect(gungi.fen()).toBe('m8/9/8d/9/9/9/J8/9/M8 -/- w 3 - 19');
			expect(last.san).toBe('兵(4-1-1)(3-1-1)=');
			expectRepetition(gungi, true);
			expect(gungi.moves()).toEqual([]);
		});

		it('should not count the same board with different hands as a repeat', () => {
			const start = 'm8/9/8d/9/9/4d4/J3D4/9/M8 D1/- w 3 - 1';
			const gungi = new Gungi(start);
			const shuffle = [
				'小(7-9-1)(7-8-1)',
				'兵(3-1-1)(4-1-1)',
				'小(7-8-1)(7-9-1)',
				'兵(4-1-1)(3-1-1)',
			];

			// The starting position occurs at plies 0, 4 and 8.
			[...shuffle, ...shuffle].forEach((move) => gungi.move(move));
			expect(gungi.fen()).toBe(start.replace(/ 1$/, ' 5'));
			expectRepetition(gungi, false);

			// Black captures the white 兵 on 7-5 and returns, and white drops its
			// hand 兵 on 7-5: the same board with white to move, but white's hand is empty.
			[
				'小(7-9-1)(7-8-1)',
				'兵(6-5-1)取(7-5-1)',
				'小(7-8-1)(6-9-1)',
				'兵(7-5-1)(6-5-1)',
				'小(6-9-1)(7-9-1)',
				'兵(3-1-1)(4-1-1)',
				'新兵(7-5-1)',
				'兵(4-1-1)(3-1-1)',
			].forEach((move) => gungi.move(move));
			expect(gungi.fen()).toBe('m8/9/8d/9/9/4d4/J3D4/9/M8 -/- w 3 - 9');
			// 4th occurrence of the board with white to move, 1st with these hands
			expectRepetition(gungi, false);
			expect(gungi.moves().length).toBeGreaterThan(0);

			// With empty hands the positions repeat on their own: the one after
			// the drop (black to move) occurs at plies 15, 19, 23 and 27.
			[...shuffle, ...shuffle, ...shuffle.slice(0, 2)].forEach((move) =>
				gungi.move(move)
			);
			expectRepetition(gungi, false);
			gungi.move(shuffle[2]);
			expect(gungi.fen()).toBe('m8/9/9/8d/9/4d4/J3D4/9/M8 -/- b 3 - 14');
			expectRepetition(gungi, true);
		});

		it('should detect fourfold repetition of the starting position', () => {
			const gungi = new Gungi(INTRO_POSITION);
			const cycle = [
				'兵(7-1-1)(6-1-1)',
				'侍(3-4-1)(4-4-1)',
				'兵(6-1-1)(7-1-1)',
				'侍(4-4-1)(3-4-1)',
			];
			expect(gungi.isFourfoldRepetition()).toBe(false);

			for (let i = 0; i < 2; i++) {
				cycle.forEach((move) => gungi.move(move));
				expectRepetition(gungi, false);
			}

			cycle.slice(0, 3).forEach((move) => gungi.move(move));
			expectRepetition(gungi, false);
			gungi.move(cycle[3]);
			expect(gungi.fen()).toBe(INTRO_POSITION.replace(/ 1$/, ' 7'));
			expectRepetition(gungi, true);
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

	describe('Checkmate with marshal capture available', () => {
		it('is not checkmate when the checked side can capture the enemy marshal', () => {
			const gungi = new Gungi(
				'r1|s:n|m2r|s:g|1/4k|a:J|j2/|n:K:F|1ww1f3/1nt6/2c6/a8/1|D:D:G||S:d|6/1|N:N||S:M|6/9 I1R1F1C1A1T1/d2 w 3 - 33'
			);
			const move = gungi.move('小(2-4-2)(2-5-2)付');

			expect(move.san).toBe('小(2-4-2)(2-5-2)付');
			expect(gungi.inCheck('b')).toBe(true);
			expect(gungi.isCheckmate()).toBe(false);
			expect(gungi.isGameOver()).toBe(false);
			expect(gungi.moves()).toContain('兵(7-7-2)取(8-7-1)#');

			gungi.move('兵(7-7-2)取(8-7-1)#');
			expect(gungi.isGameOver()).toBe(true);
		});
	});
});
