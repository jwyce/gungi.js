import { describe, expect, it } from 'vitest';
import type { Board, Color, Move, PieceType } from '../src/gungi/utils';
import { encodeFEN } from '../src/gungi/fen';
import { Gungi } from '../src/gungi/gungi';
import { piece } from '../src/gungi/utils';

function createEmptyBoard(): Board {
	return Array.from({ length: 9 }, () =>
		Array.from({ length: 9 }, () => [null])
	);
}

function placeTower(
	board: Board,
	square: string,
	pieces: { type: PieceType; color: Color }[]
) {
	const [rank, file] = square.split('-').map(Number);
	board[rank - 1][9 - file] = pieces.map((p, i) => ({
		square,
		tier: i + 1,
		type: p.type,
		color: p.color,
	}));
}

function getTargets(gungi: Gungi, square: string) {
	const moves = gungi.moves({ square, verbose: true });
	const verboseMoves = moves.filter((m): m is Move => typeof m !== 'string');
	return verboseMoves.map((m) => m.to.slice(0, -2));
}

function getSanMoves(gungi: Gungi) {
	return gungi.moves().filter((m): m is string => typeof m === 'string');
}

describe('Rules Updates', () => {
	describe('Draft completion priority', () => {
		it('ends draft immediately when black chooses 終', () => {
			const gungi = new Gungi(
				'9/9/9/9/9/9/9/9/4M4 G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 b 3 wb 1'
			);

			const blackDoneMove = getSanMoves(gungi).find(
				(m) => m.startsWith('新帥') && m.endsWith('終')
			);
			expect(blackDoneMove).toBeDefined();
			if (!blackDoneMove) throw new Error('Expected black 終 move');

			gungi.move(blackDoneMove);

			expect(gungi.inDraft()).toBe(false);
			expect(gungi.getDraftingRights()).toStrictEqual({ b: false, w: false });
			expect(gungi.turn()).toBe('w');
			expect(gungi.moves({ square: '9-5' }).length).toBeGreaterThan(0);
		});

		it('keeps draft active when white chooses 終 and allows black to keep placing', () => {
			const gungi = new Gungi('4m4/9/9/9/9/9/9/9/4M4 D1/d2 w 3 wb 1');

			const whiteDoneMove = getSanMoves(gungi).find((m) => m.endsWith('終'));
			expect(whiteDoneMove).toBeDefined();
			if (!whiteDoneMove) throw new Error('Expected white 終 move');

			gungi.move(whiteDoneMove);

			expect(gungi.inDraft()).toBe(true);
			expect(gungi.getDraftingRights()).toStrictEqual({ b: true, w: false });
			expect(gungi.turn()).toBe('b');

			const blackMoves = getSanMoves(gungi);
			expect(blackMoves.some((m) => !m.endsWith('終'))).toBe(true);
		});
	});

	describe('Archer wing blocking', () => {
		it('blocks a diagonal when its side wing has a higher tower', () => {
			const board = createEmptyBoard();
			placeTower(board, '5-5', [{ type: piece.archer, color: 'w' }]);
			placeTower(board, '4-6', [
				{ type: piece.soldier, color: 'b' },
				{ type: piece.warrior, color: 'b' },
			]);
			placeTower(board, '1-1', [{ type: piece.marshal, color: 'b' }]);
			placeTower(board, '9-9', [{ type: piece.marshal, color: 'w' }]);

			const fen = encodeFEN({
				board,
				hand: [],
				turn: 'w',
				mode: 'advanced',
				drafting: { b: false, w: false },
				moveNumber: 1,
			});
			const gungi = new Gungi(fen);

			const targets = getTargets(gungi, '5-5');
			expect(targets).toContain('3-4');
			expect(targets).not.toContain('3-6');
		});

		it('keeps diagonal legal when wing tower is not higher', () => {
			const board = createEmptyBoard();
			placeTower(board, '5-5', [{ type: piece.archer, color: 'w' }]);
			placeTower(board, '4-6', [{ type: piece.soldier, color: 'b' }]);
			placeTower(board, '1-1', [{ type: piece.marshal, color: 'b' }]);
			placeTower(board, '9-9', [{ type: piece.marshal, color: 'w' }]);

			const fen = encodeFEN({
				board,
				hand: [],
				turn: 'w',
				mode: 'advanced',
				drafting: { b: false, w: false },
				moveNumber: 1,
			});
			const gungi = new Gungi(fen);

			const targets = getTargets(gungi, '5-5');
			expect(targets).toContain('3-6');
		});
	});

	describe('Forward-only leap for jumping pieces', () => {
		it('allows cannon to leap forward but not sideways/backward', () => {
			const board = createEmptyBoard();
			placeTower(board, '5-5', [
				{ type: piece.soldier, color: 'w' },
				{ type: piece.warrior, color: 'w' },
				{ type: piece.cannon, color: 'w' },
			]);
			placeTower(board, '2-5', [{ type: piece.soldier, color: 'b' }]);
			placeTower(board, '5-6', [{ type: piece.soldier, color: 'b' }]);
			placeTower(board, '6-5', [{ type: piece.soldier, color: 'b' }]);
			placeTower(board, '1-1', [{ type: piece.marshal, color: 'b' }]);
			placeTower(board, '9-9', [{ type: piece.marshal, color: 'w' }]);

			const fen = encodeFEN({
				board,
				hand: [],
				turn: 'w',
				mode: 'advanced',
				drafting: { b: false, w: false },
				moveNumber: 1,
			});
			const gungi = new Gungi(fen);

			const targets = getTargets(gungi, '5-5');
			expect(targets).toContain('1-5');
			expect(targets).not.toContain('5-7');
			expect(targets).not.toContain('7-5');
		});

		it('allows archer to leap forward but not backward', () => {
			const board = createEmptyBoard();
			placeTower(board, '5-5', [
				{ type: piece.soldier, color: 'w' },
				{ type: piece.warrior, color: 'w' },
				{ type: piece.archer, color: 'w' },
			]);
			placeTower(board, '3-5', [{ type: piece.soldier, color: 'b' }]);
			placeTower(board, '6-5', [{ type: piece.soldier, color: 'b' }]);
			placeTower(board, '1-1', [{ type: piece.marshal, color: 'b' }]);
			placeTower(board, '9-9', [{ type: piece.marshal, color: 'w' }]);

			const fen = encodeFEN({
				board,
				hand: [],
				turn: 'w',
				mode: 'advanced',
				drafting: { b: false, w: false },
				moveNumber: 1,
			});
			const gungi = new Gungi(fen);

			const targets = getTargets(gungi, '5-5');
			expect(targets).toContain('1-5');
			expect(targets).not.toContain('7-5');
		});

		it('allows musketeer to leap forward but not backward diagonals', () => {
			const board = createEmptyBoard();
			placeTower(board, '5-5', [
				{ type: piece.soldier, color: 'w' },
				{ type: piece.warrior, color: 'w' },
				{ type: piece.musketeer, color: 'w' },
			]);
			placeTower(board, '3-5', [{ type: piece.soldier, color: 'b' }]);
			placeTower(board, '6-6', [{ type: piece.soldier, color: 'b' }]);
			placeTower(board, '1-1', [{ type: piece.marshal, color: 'b' }]);
			placeTower(board, '9-9', [{ type: piece.marshal, color: 'w' }]);

			const fen = encodeFEN({
				board,
				hand: [],
				turn: 'w',
				mode: 'advanced',
				drafting: { b: false, w: false },
				moveNumber: 1,
			});
			const gungi = new Gungi(fen);

			const targets = getTargets(gungi, '5-5');
			expect(targets).toContain('1-5');
			expect(targets).not.toContain('7-7');
		});
	});

	describe('Tactician arata betrayal', () => {
		it('allows 新謀 to betray when arata onto a friendly-topped stack', () => {
			const board = createEmptyBoard();
			placeTower(board, '5-5', [
				{ type: piece.soldier, color: 'b' },
				{ type: piece.warrior, color: 'w' },
			]);
			placeTower(board, '1-1', [{ type: piece.marshal, color: 'b' }]);
			placeTower(board, '9-9', [{ type: piece.marshal, color: 'w' }]);

			const fen = encodeFEN({
				board,
				hand: [
					{ type: piece.tactician, color: 'w', count: 1 },
					{ type: piece.soldier, color: 'w', count: 1 },
				],
				turn: 'w',
				mode: 'advanced',
				drafting: { b: false, w: false },
				moveNumber: 1,
			});
			const gungi = new Gungi(fen);

			const sanMoves = getSanMoves(gungi);
			expect(sanMoves).toContain('新謀(5-5-3)返兵');

			gungi.move('新謀(5-5-3)返兵');

			const movedTower = gungi.get('5-5');
			expect(movedTower?.map((p) => p.type)).toStrictEqual(['兵', '侍', '謀']);
			expect(movedTower?.every((p) => p.color === 'w')).toBe(true);

			expect(
				gungi.hand('w').find((h) => h.type === piece.tactician)
			).toBeUndefined();
			expect(
				gungi.hand('w').find((h) => h.type === piece.soldier)
			).toBeUndefined();
		});

		it('allows black 新謀 to betray when arata onto a friendly-topped stack', () => {
			const board = createEmptyBoard();
			placeTower(board, '5-5', [
				{ type: piece.soldier, color: 'w' },
				{ type: piece.warrior, color: 'b' },
			]);
			placeTower(board, '1-1', [{ type: piece.marshal, color: 'b' }]);
			placeTower(board, '9-9', [{ type: piece.marshal, color: 'w' }]);

			const fen = encodeFEN({
				board,
				hand: [
					{ type: piece.tactician, color: 'b', count: 1 },
					{ type: piece.soldier, color: 'b', count: 1 },
				],
				turn: 'b',
				mode: 'advanced',
				drafting: { b: false, w: false },
				moveNumber: 1,
			});
			const gungi = new Gungi(fen);

			const sanMoves = getSanMoves(gungi);
			expect(sanMoves).toContain('新謀(5-5-3)返兵');

			gungi.move('新謀(5-5-3)返兵');

			const movedTower = gungi.get('5-5');
			expect(movedTower?.map((p) => p.type)).toStrictEqual(['兵', '侍', '謀']);
			expect(movedTower?.every((p) => p.color === 'b')).toBe(true);

			expect(
				gungi.hand('b').find((h) => h.type === piece.tactician)
			).toBeUndefined();
			expect(
				gungi.hand('b').find((h) => h.type === piece.soldier)
			).toBeUndefined();
		});
	});

	describe('Tactician onboard betrayal', () => {
		it('allows 謀 to betray when stacking onto a friendly-topped stack with enemy underneath', () => {
			const gungi = new Gungi(
				'4m4/9/9/3|s:D|5/4|f:w:T|4/9/9/9/4M4 D1S1T1/- w 3 - 1'
			);

			const sanMoves = getSanMoves(gungi);
			expect(sanMoves).toContain('謀(5-5-3)(4-6-3)付');
			expect(sanMoves).toContain('謀(5-5-3)(4-6-3)返忍');

			gungi.move('謀(5-5-3)(4-6-3)返忍');

			const movedTower = gungi.get('4-6');
			expect(movedTower?.map((p) => p.type)).toStrictEqual(['忍', '兵', '謀']);
			expect(movedTower?.every((p) => p.color === 'w')).toBe(true);
			expect(gungi.hand('w').find((h) => h.type === piece.spy)).toBeUndefined();
		});
	});
});
