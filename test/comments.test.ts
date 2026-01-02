import { describe, expect, it } from 'vitest';
import { Gungi, INTRO_POSITION } from '../src/gungi/gungi';

describe('comments', () => {
	it('should set and get a comment for current position', () => {
		const gungi = new Gungi(INTRO_POSITION);
		gungi.move('兵(7-1-1)(6-1-1)');

		gungi.setComment('Opening move');
		expect(gungi.getComment()).toBe('Opening move');
	});

	it('should return undefined when no comment exists', () => {
		const gungi = new Gungi(INTRO_POSITION);
		gungi.move('兵(7-1-1)(6-1-1)');

		expect(gungi.getComment()).toBeUndefined();
	});

	it('should remove and return comment for current position', () => {
		const gungi = new Gungi(INTRO_POSITION);
		gungi.move('兵(7-1-1)(6-1-1)');
		gungi.setComment('test');

		expect(gungi.removeComment()).toBe('test');
		expect(gungi.getComment()).toBeUndefined();
		expect(gungi.removeComment()).toBeUndefined();
	});

	it('should get all comments with FEN', () => {
		const gungi = new Gungi(INTRO_POSITION);
		gungi.move('兵(7-1-1)(6-1-1)');
		gungi.setComment('First move');
		gungi.move('侍(3-4-1)(4-4-1)');
		gungi.setComment('Second move');

		const comments = gungi.getComments();
		expect(comments).toHaveLength(2);
		expect(comments.some((c) => c.comment === 'First move')).toBe(true);
		expect(comments.some((c) => c.comment === 'Second move')).toBe(true);
	});

	it('should remove all comments and return them', () => {
		const gungi = new Gungi(INTRO_POSITION);
		gungi.move('兵(7-1-1)(6-1-1)');
		gungi.setComment('First');
		gungi.move('侍(3-4-1)(4-4-1)');
		gungi.setComment('Second');

		const removed = gungi.removeComments();
		expect(removed).toHaveLength(2);
		expect(gungi.getComments()).toHaveLength(0);
	});

	it('should not include comments in pgn by default', () => {
		const gungi = new Gungi(INTRO_POSITION);
		gungi.move('兵(7-1-1)(6-1-1)');
		gungi.setComment('test comment');

		const pgn = gungi.pgn();
		expect(pgn).not.toContain('{');
		expect(pgn).not.toContain('test comment');
	});

	it('should include comments in pgn with withComments option', () => {
		const gungi = new Gungi(INTRO_POSITION);
		gungi.move('兵(7-1-1)(6-1-1)');
		gungi.setComment('Opening');
		gungi.move('侍(3-4-1)(4-4-1)');

		const pgn = gungi.pgn({ withComments: true });
		expect(pgn).toContain('{Opening}');
	});

	it('should clear comments on reset', () => {
		const gungi = new Gungi(INTRO_POSITION);
		gungi.move('兵(7-1-1)(6-1-1)');
		gungi.setComment('test');

		gungi.reset();
		expect(gungi.getComments()).toHaveLength(0);
	});

	it('should clear comments on clear', () => {
		const gungi = new Gungi(INTRO_POSITION);
		gungi.move('兵(7-1-1)(6-1-1)');
		gungi.setComment('test');

		gungi.clear();
		expect(gungi.getComments()).toHaveLength(0);
	});

	it('should preserve comment when navigating back to same position', () => {
		const gungi = new Gungi(INTRO_POSITION);
		gungi.move('兵(7-1-1)(6-1-1)');
		gungi.setComment('First position');
		const fen = gungi.fen();

		gungi.move('侍(3-4-1)(4-4-1)');
		gungi.undo();

		expect(gungi.fen()).toBe(fen);
		expect(gungi.getComment()).toBe('First position');
	});

	it('should parse comments from PGN in loadPgn', () => {
		const gungi = new Gungi(INTRO_POSITION);
		const pgn =
			'1. 兵(7-1-1)(6-1-1) {Opening move} 侍(3-4-1)(4-4-1) {Response}';

		gungi.loadPgn(pgn, INTRO_POSITION);

		const comments = gungi.getComments();
		expect(comments).toHaveLength(2);
		expect(comments.some((c) => c.comment === 'Opening move')).toBe(true);
		expect(comments.some((c) => c.comment === 'Response')).toBe(true);
	});

	it('should roundtrip pgn with comments', () => {
		const gungi = new Gungi(INTRO_POSITION);
		gungi.move('兵(7-1-1)(6-1-1)');
		gungi.setComment('First');
		gungi.move('侍(3-4-1)(4-4-1)');
		gungi.setComment('Second');

		const pgnWithComments = gungi.pgn({ withComments: true });

		const gungi2 = new Gungi(INTRO_POSITION);
		gungi2.loadPgn(pgnWithComments, INTRO_POSITION);

		expect(gungi2.getComments()).toHaveLength(2);
		expect(gungi2.pgn({ withComments: true })).toBe(pgnWithComments);
	});
});
