import { describe, expect, it } from 'vitest';
import {
	ADVANCED_POSITION,
	BEGINNNER_POSITION,
	encodeFEN,
	INTERMEDIATE_POSITION,
	INTRO_POSITION,
	parseFEN,
} from '../src/gungi/fen';
import { piece, SetupMode } from '../src/gungi/utils';

describe('parseFEN', () => {
	it('should correctly parse the INTRO_POSITION string', () => {
		const result = parseFEN(INTRO_POSITION);

		expect(result.turn).toBe('w');
		expect(result.mode).toBe('intro' as SetupMode);
		expect(result.drafting).toStrictEqual({ b: false, w: false });
		expect(result.moveNumber).toBe(1);

		expect(result.board).toHaveLength(9);
		result.board.forEach((rank) => {
			expect(rank).toHaveLength(9);
		});

		expect(result.board[0][4][0]).toStrictEqual({
			color: 'b',
			square: '1-5',
			tier: 1,
			type: piece.marshal,
		});
		expect(result.board[8][3][0]).toStrictEqual({
			color: 'w',
			square: '9-6',
			tier: 1,
			type: piece.general,
		});
	});

	it('should correctly parse the BEGINNNER_POSITION string', () => {
		const result = parseFEN(BEGINNNER_POSITION);

		expect(result.turn).toBe('w');
		expect(result.mode).toBe('beginner' as SetupMode);
		expect(result.drafting).toStrictEqual({ b: false, w: false });
		expect(result.moveNumber).toBe(1);

		expect(result.board).toHaveLength(9);

		expect(result.board[1][2][0]).toStrictEqual({
			color: 'b',
			square: '2-7',
			tier: 1,
			type: piece.archer,
		});
		expect(result.board[8][4][0]).toStrictEqual({
			color: 'w',
			square: '9-5',
			tier: 1,
			type: piece.marshal,
		});
	});

	it('should correctly parse the INTERMEDIATE_POSITION string', () => {
		const result = parseFEN(INTERMEDIATE_POSITION);

		expect(result.turn).toBe('w');
		expect(result.mode).toBe('intermediate' as SetupMode);
		expect(result.drafting).toStrictEqual({ b: true, w: true });
		expect(result.moveNumber).toBe(1);

		result.board.forEach((rank) => {
			rank.forEach((square) => {
				expect(square[0]).toBeNull();
			});
		});
	});

	it('should correctly parse the ADVANCED_POSITION string', () => {
		const result = parseFEN(ADVANCED_POSITION);

		expect(result.turn).toBe('w');
		expect(result.mode).toBe('advanced' as SetupMode);
		expect(result.drafting).toStrictEqual({ b: true, w: true });
		expect(result.moveNumber).toBe(1);

		result.board.forEach((rank) => {
			rank.forEach((square) => {
				expect(square[0]).toBeNull();
			});
		});
	});

	it('should handle towers and empty squares correctly', () => {
		const fen = '3img3/1sa|a:g:s|1s3/9/9/9/9/9/9/9 d2/M1N3 b 3 b 2';
		const result = parseFEN(fen);

		expect(result.turn).toBe('b');
		expect(result.mode).toBe('advanced' as SetupMode);
		expect(result.drafting).toStrictEqual({ b: true, w: false });
		expect(result.moveNumber).toBe(2);

		const tower = result.board[1][3];
		expect(tower).toHaveLength(3);
		const p = { color: 'b', square: '2-6', tier: 1, type: piece.archer };
		expect(tower[0]).toStrictEqual(p);
		expect(tower[1]).toStrictEqual({ ...p, type: piece.general, tier: 2 });
		expect(tower[2]).toStrictEqual({ ...p, type: piece.spy, tier: 3 });

		expect(result.board[8][8][0]).toBeNull();
	});

	it('should handle towers placed right next to each other correctly', () => {
		const fen = '3img3/1sa|a:g:s|d:w|k:n|r:w|2/9/9/9/9/9/9/9 d2/M1N3 w 1 w 3';
		const result = parseFEN(fen);

		expect(result.turn).toBe('w');
		expect(result.mode).toBe('beginner' as SetupMode);
		expect(result.drafting).toStrictEqual({ b: false, w: true });
		expect(result.moveNumber).toBe(3);

		// Check the first tower
		const tower1 = result.board[1][3];
		const p1 = { color: 'b', square: '2-6', tier: 1, type: piece.archer };
		expect(tower1).toHaveLength(3);
		expect(tower1[0]).toStrictEqual(p1);
		expect(tower1[1]).toStrictEqual({ ...p1, type: piece.general, tier: 2 });
		expect(tower1[2]).toStrictEqual({ ...p1, type: piece.spy, tier: 3 });

		// Check the second tower
		const tower2 = result.board[1][4];
		const p2 = { color: 'b', square: '2-5', tier: 1, type: piece.soldier };
		expect(tower2).toHaveLength(2);
		expect(tower2[0]).toStrictEqual(p2);
		expect(tower2[1]).toStrictEqual({ ...p2, type: piece.warrior, tier: 2 });

		// Check the third tower
		const tower3 = result.board[1][5];
		const p3 = { color: 'b', square: '2-4', tier: 1, type: piece.musketeer };
		expect(tower3).toHaveLength(2);
		expect(tower3[0]).toStrictEqual(p3);
		expect(tower3[1]).toStrictEqual({ ...p3, type: piece.lancer, tier: 2 });

		// Check the fourth tower
		const tower4 = result.board[1][6];
		const p4 = { color: 'b', square: '2-3', tier: 1, type: piece.rider };
		expect(tower4).toHaveLength(2);
		expect(tower4[0]).toStrictEqual(p4);
		expect(tower4[1]).toStrictEqual({ ...p4, type: piece.warrior, tier: 2 });

		// Ensure unrelated board squares are parsed as expected
		expect(result.board[0][0][0]).toBeNull(); // Top left empty square
		expect(result.board[8][8][0]).toBeNull(); // Bottom right empty square
	});

	// Additional hand parsing test
	it('should correctly parse hand pieces from FEN strings', () => {
		const fen =
			'3img3/1sa1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 0 1';
		const result = parseFEN(fen);

		expect(result.hand).toHaveLength(10); // 5 for white, 5 for black

		// Check white hand
		expect(result.hand[0]).toStrictEqual({
			type: piece.major_general,
			color: 'w',
			count: 2,
		});
		expect(result.hand[1]).toStrictEqual({
			type: piece.lancer,
			color: 'w',
			count: 2,
		});

		// Check black hand
		expect(result.hand[5]).toStrictEqual({
			type: piece.major_general,
			color: 'b',
			count: 2,
		});
		expect(result.hand[9]).toStrictEqual({
			type: piece.soldier,
			color: 'b',
			count: 1,
		});
	});

	// Round-trip test for FEN encoding and decoding
	it('should correctly encode and decode FEN strings symmetrically', () => {
		const fen =
			'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1';
		const parsed = parseFEN(fen);
		const encoded = encodeFEN(parsed);

		expect(encoded).toBe(fen);
	});
});
