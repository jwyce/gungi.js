import { describe, expect, it } from 'vitest';
import {
	ADVANCED_FEN,
	BEGINNNER_FEN,
	INTERMEDIATE_FEN,
	INTRO_FEN,
	parseFEN,
} from '../src/gungi/fen';
import { piece, SetupMode } from '../src/gungi/utils';

describe('parseFEN', () => {
	it('should correctly parse the INTRO_FEN string', () => {
		const result = parseFEN(INTRO_FEN);

		expect(result.turn).toBe('w');
		expect(result.mode).toBe('intro' as SetupMode);
		expect(result.draft).toBe(false);
		expect(result.fullmoves).toBe(1);

		expect(result.board).toHaveLength(9);
		result.board.forEach((rank) => {
			expect(rank).toHaveLength(9);
		});

		expect(result.board[0][4][0]).toBe(`b${piece.marshal}`);
		expect(result.board[8][3][0]).toBe(`w${piece.general}`);
	});

	it('should correctly parse the BEGINNNER_FEN string', () => {
		const result = parseFEN(BEGINNNER_FEN);

		expect(result.turn).toBe('w');
		expect(result.mode).toBe('beginner' as SetupMode);
		expect(result.draft).toBe(false);
		expect(result.fullmoves).toBe(1);

		expect(result.board).toHaveLength(9);

		expect(result.board[1][2][0]).toBe(`b${piece.archer}`);
		expect(result.board[8][4][0]).toBe(`w${piece.marshal}`);
	});

	it('should correctly parse the INTERMEDIATE_FEN string', () => {
		const result = parseFEN(INTERMEDIATE_FEN);

		expect(result.turn).toBe('w');
		expect(result.mode).toBe('intermediate' as SetupMode);
		expect(result.draft).toBe(false);
		expect(result.fullmoves).toBe(1);

		result.board.forEach((rank) => {
			rank.forEach((square) => {
				expect(square[0]).toBeNull();
			});
		});
	});

	it('should correctly parse the ADVANCED_FEN string', () => {
		const result = parseFEN(ADVANCED_FEN);

		expect(result.turn).toBe('w');
		expect(result.mode).toBe('advanced' as SetupMode);
		expect(result.draft).toBe(false);
		expect(result.fullmoves).toBe(1);

		result.board.forEach((rank) => {
			rank.forEach((square) => {
				expect(square[0]).toBeNull();
			});
		});
	});

	it('should handle towers and empty squares correctly', () => {
		const fen = '3img3/1sa|a:g:s|1s3/9/9/9/9/9/9/9 b 3 0 2';
		const result = parseFEN(fen);

		expect(result.turn).toBe('b');
		expect(result.mode).toBe('advanced' as SetupMode);
		expect(result.draft).toBe(false);
		expect(result.fullmoves).toBe(2);

		const tower = result.board[1][3];
		expect(tower).toHaveLength(3);
		expect(tower[0]).toBe(`b${piece.archer}`);
		expect(tower[1]).toBe(`b${piece.general}`);
		expect(tower[2]).toBe(`b${piece.spy}`);

		expect(result.board[8][8][0]).toBeNull();
	});

	it('should handle towers placed right next to each other correctly', () => {
		const fen = '3img3/1sa|a:g:s|d:w|k:n|r:w|2/9/9/9/9/9/9/9 w 1 0 3';
		const result = parseFEN(fen);

		expect(result.turn).toBe('w');
		expect(result.mode).toBe('beginner' as SetupMode);
		expect(result.draft).toBe(false);
		expect(result.fullmoves).toBe(3);

		// Check the first tower
		const tower1 = result.board[1][3];
		expect(tower1).toHaveLength(3);
		expect(tower1[0]).toBe(`b${piece.archer}`);
		expect(tower1[1]).toBe(`b${piece.general}`);
		expect(tower1[2]).toBe(`b${piece.spy}`);

		// Check the second tower
		const tower2 = result.board[1][4];
		expect(tower2).toHaveLength(2);
		expect(tower2[0]).toBe(`b${piece.soldier}`);
		expect(tower2[1]).toBe(`b${piece.warrior}`);

		// Check the third tower
		const tower3 = result.board[1][5];
		expect(tower3).toHaveLength(2);
		expect(tower3[0]).toBe(`b${piece.musketeer}`);
		expect(tower3[1]).toBe(`b${piece.lancer}`);

		// Check the fourth tower
		const tower4 = result.board[1][6];
		expect(tower4).toHaveLength(2);
		expect(tower4[0]).toBe(`b${piece.rider}`);
		expect(tower4[1]).toBe(`b${piece.warrior}`);

		// Ensure unrelated board squares are parsed as expected
		expect(result.board[0][0][0]).toBeNull(); // Top left empty square
		expect(result.board[8][8][0]).toBeNull(); // Bottom right empty square
	});
});
