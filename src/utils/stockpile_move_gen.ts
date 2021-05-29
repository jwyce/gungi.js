import { get_top } from './helper';
import { Piece, StockPiece, RelaxMove } from './../interfaces/igungi';
import {
	BLACK,
	DRAFT,
	FILE_1,
	FILE_9,
	FORTRESS,
	MARSHAL,
	PAWN,
	PLACE,
	RANK_1,
	RANK_3,
	RANK_4,
	RANK_6,
	RANK_7,
	RANK_9,
	READY,
	WHITE,
} from './constants';

const get_stockpile = (stockpile: StockPiece[], color?: 'w' | 'b') => {
	if (!color) {
		return stockpile;
	}

	return stockpile.filter((x) => x.piece.color === color);
};

export const stockpile_move_gen = (
	board: Array<Array<Array<Piece | null>>>,
	phase: 'draft' | 'game',
	turn: 'w' | 'b',
	stockpile: StockPiece[],
	marshal_placed: { w: number; b: number },
	army_size: { w: number; b: number }
) => {
	var moves: RelaxMove[] = [];

	if (phase === DRAFT) {
		if (turn === BLACK) {
			if (marshal_placed.b === 0) {
				// first piece placed must be marshall
				// add all valid squares in first 3 ranks
				for (var i = RANK_7; i <= RANK_9; i++) {
					for (var j = FILE_1; j <= FILE_9; j++) {
						moves.push({
							src: {
								type: MARSHAL,
								color: BLACK,
							},
							dst: i + '-' + j,
							type: PLACE,
						});
					}
				}
			} else {
				// after marshall placed
				moves.push({
					src: null,
					dst: null,
					type: READY,
				});

				if (army_size.b === 26) {
					// maximum number of pieces at any time is 26
					return moves;
				}

				var pieces = get_stockpile(stockpile, BLACK)
					.filter((x) => x.amount > 0)
					.map((x) => x.piece);
				pieces.forEach((piece) => {
					for (var i = RANK_7; i <= RANK_9; i++) {
						for (var j = FILE_1; j <= FILE_9; j++) {
							var dest = get_top(board, i + '-' + j);

							if (piece.type === FORTRESS) {
								if (dest === null) {
									// fortress can't stack on other pieces
									moves.push({
										src: piece,
										dst: i + '-' + j,
										type: PLACE,
									});
								}
							} else {
								if (!dest || (dest.tier < 3 && dest.piece?.type !== MARSHAL)) {
									// marhsall cannot be stacked on
									if (piece.type === PAWN) {
										var pawns_in_file = board
											.map((x) => x[j - 1])
											.filter((x) =>
												x.some(
													(item) =>
														item !== null &&
														item.color === BLACK &&
														item.type === PAWN
												)
											).length;
										if (pawns_in_file === 0) {
											// multiple pawns can't be placed in the same file
											moves.push({
												src: piece,
												dst: i + '-' + j,
												type: PLACE,
											});
										}
									} else {
										moves.push({
											src: piece,
											dst: i + '-' + j,
											type: PLACE,
										});
									}
								}
							}
						}
					}
				});
			}
		} else {
			// white's turn
			if (marshal_placed.w === 0) {
				// first piece placed must be marshall
				// add all valid squares in first 3 ranks
				for (var i = RANK_1; i <= RANK_3; i++) {
					for (var j = FILE_1; j <= FILE_9; j++) {
						moves.push({
							src: {
								type: MARSHAL,
								color: WHITE,
							},
							dst: i + '-' + j,
							type: PLACE,
						});
					}
				}
			} else {
				// after marshall placed
				moves.push({
					src: null,
					dst: null,
					type: READY,
				});

				if (army_size.w === 26) {
					// maximum number of pieces at any time is 26
					return moves;
				}

				var pieces = get_stockpile(stockpile, WHITE)
					.filter((x) => x.amount > 0)
					.map((x) => x.piece);
				pieces.forEach((piece) => {
					for (var i = RANK_1; i <= RANK_3; i++) {
						for (var j = FILE_1; j <= FILE_9; j++) {
							var dest = get_top(board, i + '-' + j);

							if (piece.type === FORTRESS) {
								if (dest === null) {
									// fortress can't stack on other pieces
									moves.push({
										src: piece,
										dst: i + '-' + j,
										type: PLACE,
									});
								}
							} else {
								if (!dest || (dest.tier < 3 && dest.piece?.type !== MARSHAL)) {
									// marhsall cannot be stacked on
									if (piece.type == PAWN) {
										var pawns_in_file = board
											.map((x) => x[j - 1])
											.filter((x) =>
												x.some(
													(item) =>
														item !== null &&
														item.color === WHITE &&
														item.type === PAWN
												)
											).length;
										if (pawns_in_file === 0) {
											// multiple pawns can't be placed in the same file
											moves.push({
												src: piece,
												dst: i + '-' + j,
												type: PLACE,
											});
										}
									} else {
										moves.push({
											src: piece,
											dst: i + '-' + j,
											type: PLACE,
										});
									}
								}
							}
						}
					}
				});
			}
		}
	} else {
		// game phase
		if (turn === BLACK) {
			if (army_size.b === 26) {
				// maximum number of pieces at any time is 26
				return moves;
			}

			var pieces = get_stockpile(stockpile, BLACK)
				.filter((x) => x.amount > 0)
				.map((x) => x.piece);
			pieces.forEach((piece) => {
				for (var i = RANK_4; i <= RANK_9; i++) {
					for (var j = FILE_1; j <= FILE_9; j++) {
						var dest = get_top(board, i + '-' + j);

						if (piece.type === FORTRESS) {
							if (dest === null) {
								// fortress can't stack on other pieces
								moves.push({
									src: piece,
									dst: i + '-' + j,
									type: PLACE,
								});
							}
						} else {
							if (!dest || (dest.tier < 3 && dest.piece?.type !== MARSHAL)) {
								// marhsall cannot be stacked on
								if (piece.type == PAWN) {
									var pawns_in_file = board
										.map((x) => x[j - 1])
										.filter((x) =>
											x.some(
												(item) =>
													item !== null &&
													item.color === BLACK &&
													item.type === PAWN
											)
										).length;
									if (pawns_in_file === 0) {
										// multiple pawns can't be placed in the same file
										moves.push({
											src: piece,
											dst: i + '-' + j,
											type: PLACE,
										});
									}
								} else {
									moves.push({
										src: piece,
										dst: i + '-' + j,
										type: PLACE,
									});
								}
							}
						}
					}
				}
			});
		} else {
			// white's turn
			if (army_size.w === 26) {
				// maximum number of pieces at any time is 26
				return moves;
			}
			var pieces = get_stockpile(stockpile, WHITE)
				.filter((x) => x.amount > 0)
				.map((x) => x.piece);
			pieces.forEach((piece) => {
				for (var i = RANK_1; i <= RANK_6; i++) {
					for (var j = FILE_1; j <= FILE_9; j++) {
						var dest = get_top(board, i + '-' + j);

						if (piece.type === FORTRESS) {
							if (dest === null) {
								// fortress can't stack on other pieces
								moves.push({
									src: piece,
									dst: i + '-' + j,
									type: PLACE,
								});
							}
						} else {
							if (!dest || (dest.tier < 3 && dest.piece?.type !== MARSHAL)) {
								// marhsall cannot be stacked on
								if (piece.type == PAWN) {
									var pawns_in_file = board
										.map((x) => x[j - 1])
										.filter((x) =>
											x.some(
												(item) =>
													item !== null &&
													item.color === WHITE &&
													item.type === PAWN
											)
										).length;
									if (pawns_in_file === 0) {
										// multiple pawns can't be placed in the same file
										moves.push({
											src: piece,
											dst: i + '-' + j,
											type: PLACE,
										});
									}
								} else {
									moves.push({
										src: piece,
										dst: i + '-' + j,
										type: PLACE,
									});
								}
							}
						}
					}
				}
			});
		}
	}

	return moves;
};
