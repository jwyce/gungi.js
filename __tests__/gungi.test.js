const { TestScheduler } = require('jest');

const { Gungi } = require('gungi.js');

// describe('Checkmate', () => {
// test a position that gives checkmate
// pawns can't place marshall into mate
// })

// describe('Stalemate', () => {
// test a position that gives stalemate
// })

describe('Get', () => {
	var gungi;
	beforeEach(() => {
		gungi = new Gungi();

		gungi.move({
			src: { type: gungi.MARSHALL, color: gungi.BLACK },
			dst: '7-2',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.MARSHALL, color: gungi.WHITE },
			dst: '2-5',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.PAWN, color: gungi.BLACK },
			dst: '8-5',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.PAWN, color: gungi.WHITE },
			dst: '1-5',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.CAPTAIN, color: gungi.BLACK },
			dst: '8-5',
			type: gungi.PLACE,
		});
	});

	test('out of bounds', () => {
		expect(gungi.get('0-2')).toBeNull();
		expect(gungi.get('1-10')).toBeNull();
		expect(gungi.get('10-1')).toBeNull();
		expect(gungi.get('3-10')).toBeNull();

		expect(gungi.get_top('0-2')).toBeNull();
		expect(gungi.get_top('1-10')).toBeNull();
		expect(gungi.get_top('10-1')).toBeNull();
		expect(gungi.get_top('3-10')).toBeNull();
	});

	test('in bound null square', () => {
		expect(gungi.get('1-1')).toEqual([null, null, null]);
		expect(gungi.get_top('1-1')).toBeNull();
	});
});

describe('Check', () => {
	var gungi;

	beforeEach(() => {
		gungi = new Gungi();

		gungi.move({
			src: { type: gungi.MARSHALL, color: gungi.BLACK },
			dst: '7-2',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.MARSHALL, color: gungi.WHITE },
			dst: '2-5',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.PAWN, color: gungi.BLACK },
			dst: '8-5',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.PAWN, color: gungi.WHITE },
			dst: '1-5',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.CAPTAIN, color: gungi.BLACK },
			dst: '8-5',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.ARCHER, color: gungi.WHITE },
			dst: '1-5',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.MUSKETEER, color: gungi.BLACK },
			dst: '8-5',
			type: gungi.PLACE,
		});
	});

	test('in check', () => {
		expect(gungi.in_check()).toBeTruthy();
	});

	test('pinned piece', () => {
		expect(
			gungi.move({
				src: { type: gungi.ARCHER, color: gungi.WHITE },
				dst: '1-1',
				type: gungi.PLACE,
			})
		).toBeNull();
	});

	describe('Game Phase', () => {
		beforeEach(() => {
			gungi = new Gungi();

			gungi.move({
				src: { type: gungi.MARSHALL, color: gungi.BLACK },
				dst: '7-2',
				type: gungi.PLACE,
			});
			gungi.move({
				src: { type: gungi.MARSHALL, color: gungi.WHITE },
				dst: '2-5',
				type: gungi.PLACE,
			});
			gungi.move({
				src: { type: gungi.PAWN, color: gungi.BLACK },
				dst: '8-5',
				type: gungi.PLACE,
			});
			gungi.move({
				src: { type: gungi.PAWN, color: gungi.WHITE },
				dst: '1-5',
				type: gungi.PLACE,
			});
			gungi.move({
				src: { type: gungi.CAPTAIN, color: gungi.BLACK },
				dst: '8-5',
				type: gungi.PLACE,
			});
			gungi.move({
				src: { type: gungi.ARCHER, color: gungi.WHITE },
				dst: '1-5',
				type: gungi.PLACE,
			});
			gungi.move({
				src: { type: gungi.MUSKETEER, color: gungi.BLACK },
				dst: '8-5',
				type: gungi.PLACE,
			});
			gungi.move({
				src: { type: gungi.FORTRESS, color: gungi.WHITE },
				dst: '3-5',
				type: gungi.PLACE,
			});
			gungi.move({ src: null, dst: null, type: gungi.READY });
			gungi.move({ src: null, dst: null, type: gungi.READY });
		});

		test('pinned piece', () => {
			expect(
				gungi.move({ src: '3-5', dst: '3-4', type: gungi.PLACE })
			).toBeNull();
		});
	});
});

describe('Move Generation', () => {
	var gungi;

	beforeEach(() => {
		gungi = new Gungi();

		gungi.move({
			src: { type: gungi.MARSHALL, color: gungi.BLACK },
			dst: '7-7',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.MARSHALL, color: gungi.WHITE },
			dst: '3-6',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.MUSKETEER, color: gungi.BLACK },
			dst: '7-8',
			type: gungi.PLACE,
		});
		gungi.move({
			src: { type: gungi.PAWN, color: gungi.WHITE },
			dst: '2-8',
			type: gungi.PLACE,
		});
		gungi.move({ src: null, dst: null, type: gungi.READY });
	});

	test('marshall cannot be stacked on', () => {
		expect(
			gungi.move({
				src: { type: gungi.SPY, color: gungi.WHITE },
				dst: '3-6',
				type: gungi.PLACE,
			})
		).toBeNull();
	});

	test('fotress cannot stack on pieces', () => {
		expect(
			gungi.move({
				src: { type: gungi.FORTRESS, color: gungi.WHITE },
				dst: '2-8',
				type: gungi.PLACE,
			})
		).toBeNull();
	});

	test('pawn cannot be placed in same file as pawn of the same color', () => {
		expect(
			gungi.move({
				src: { type: gungi.PAWN, color: gungi.WHITE },
				dst: '3-8',
				type: gungi.PLACE,
			})
		).toBeNull();
	});

	test('pieces cannot be placed outside your first 3 ranks in draft phase', () => {
		expect(
			gungi.move({
				src: { type: gungi.SPY, color: gungi.WHITE },
				dst: '4-1',
				type: gungi.PLACE,
			})
		).toBeNull();
	});
});
