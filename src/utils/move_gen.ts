import { Piece, RelaxMove } from '../interfaces/igungi';
import {
	RANK_1,
	RANK_9,
	FILE_1,
	FILE_9,
	MOVEMENT,
	ATTACK,
	FORTRESS,
	STACK,
	ARCHER,
	BLACK,
	CANNON,
	CAPTAIN,
	GENERAL,
	KNIGHT,
	LIEUTENANT_GENERAL,
	MAJOR_GENERAL,
	MUSKETEER,
	PAWN,
	SAMURAI,
	SPY,
	MARSHAL,
} from './constants';
import { get, get_top } from './helper';

export const get_squares_around = (
	square: string,
	ignore_list: { rank_offset: number; file_offset: number }[]
) => {
	let squares = [];
	let rank = parseInt(square.split('-')[0]);
	let file = parseInt(square.split('-')[1]);

	for (let i = rank - 1; i <= rank + 1; i++) {
		for (let j = file - 1; j <= file + 1; j++) {
			let valid_square = !isSquareOutOfBounds(i, j);
			ignore_list.forEach((item) => {
				valid_square =
					valid_square &&
					(i != rank + item.rank_offset || j != file + item.file_offset);
			});

			if (valid_square) {
				squares.push({
					rank: i,
					file: j,
				});
			}
		}
	}

	return squares;
};

export const isSquareOutOfBounds = (rank: number, file: number) => {
	return (
		isNaN(rank) ||
		isNaN(file) ||
		rank < RANK_1 ||
		rank > RANK_9 ||
		file < FILE_1 ||
		file > FILE_9
	);
};

/**
 * * returns valid moves probing from from given square
 * @probes the moves to be probed
 * @depth inter that determines how deep to probe
 * @directions boolean array of direction to dermine where to probe
 * 0: right path
 * 1: left path
 * 2: up path
 * 3: down path
 * 4: up-right path
 * 5: up-left path
 * 6: down-right path
 * 7: down-left path
 */
export const probe_directions = (
	board: Array<Array<Array<Piece | null>>>,
	square: string,
	depth: number,
	directions: boolean[]
) => {
	let rank = parseInt(square.split('-')[0]);
	let file = parseInt(square.split('-')[1]);

	let squares = [];
	let found = Array(8).fill(false);
	let probes = Array(8).fill(null);

	for (let i = 1; i <= depth; i++) {
		probes.splice(0, 0, {
			rank: rank,
			file: file + i,
		});
		probes.splice(1, 0, {
			rank: rank,
			file: file - i,
		});
		probes.splice(2, 0, {
			rank: rank + i,
			file: file,
		});
		probes.splice(3, 0, {
			rank: rank - i,
			file: file,
		});
		probes.splice(4, 0, {
			rank: rank + i,
			file: file + i,
		});
		probes.splice(5, 0, {
			rank: rank + i,
			file: file - i,
		});
		probes.splice(6, 0, {
			rank: rank - i,
			file: file + i,
		});
		probes.splice(7, 0, {
			rank: rank - i,
			file: file - i,
		});

		for (let j = 0; j < 8; j++) {
			if (
				directions[j] &&
				!isSquareOutOfBounds(probes[j].rank, probes[j].file) &&
				!found[j]
			) {
				squares.push(probes[j]);
				found[j] =
					get_top(board, probes[j].rank + '-' + probes[j].file) !== null;
			}
		}
	}

	return squares;
};

export const generate_moves_from_probes = (
	board: Array<Array<Array<Piece | null>>>,
	probes: { rank: number; file: number }[],
	src: { piece: Piece | null; tier: number },
	square: string,
	turn: 'w' | 'b'
) => {
	let moves: RelaxMove[] = [];

	probes.forEach((x) => {
		let pos = x.rank + '-' + x.file;
		let dst = get_top(board, pos);

		if (dst === null) {
			moves.push({
				src: square,
				dst: pos,
				type: MOVEMENT,
			});
		} else {
			if (
				dst.tier < 3 &&
				dst.piece?.type != MARSHAL &&
				src.piece?.type != FORTRESS
			) {
				// pieces can't stack on marshall and fortress can't stack on other pieces
				moves.push({
					src: square,
					dst: pos,
					type: STACK,
				});
			}
			if (dst.piece?.color !== turn) {
				moves.push({
					src: square,
					dst: pos,
					type: ATTACK,
				});
			}
		}
	});

	return moves;
};

export const single_sqaure_move_gen = (
	board: Array<Array<Array<Piece | null>>>,
	src: { piece: Piece | null; tier: number },
	square: string
) => {
	let moves: { rank: number; file: number }[] = [];
	let rank = parseInt(square.split('-')[0]);
	let file = parseInt(square.split('-')[1]);
	let probes: { rank: number; file: number }[] = [];

	switch (src.piece?.type) {
		case MAJOR_GENERAL:
			switch (src.tier) {
				case 1:
					probes = [];

					if (src.piece.color == BLACK) {
						if (!isSquareOutOfBounds(rank - 1, file + 1)) {
							probes.push({
								rank: rank - 1,
								file: file + 1,
							});
						}
						if (!isSquareOutOfBounds(rank - 1, file - 1)) {
							probes.push({
								rank: rank - 1,
								file: file - 1,
							});
						}
					} else {
						if (!isSquareOutOfBounds(rank + 1, file + 1)) {
							probes.push({
								rank: rank + 1,
								file: file + 1,
							});
						}
						if (!isSquareOutOfBounds(rank + 1, file - 1)) {
							probes.push({
								rank: rank + 1,
								file: file - 1,
							});
						}
					}

					moves = moves.concat(probes);
					break;
				case 2:
					probes = [];

					var ignore_squares_white = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
						{
							rank_offset: 0,
							file_offset: -1,
						},
						{
							rank_offset: 0,
							file_offset: 1,
						},
						{
							rank_offset: -1,
							file_offset: 0,
						},
					];

					var ignore_squares_black = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
						{
							rank_offset: 0,
							file_offset: -1,
						},
						{
							rank_offset: 0,
							file_offset: 1,
						},
						{
							rank_offset: 1,
							file_offset: 0,
						},
					];

					if (src.piece.color === BLACK) {
						probes = get_squares_around(square, ignore_squares_black);
					} else {
						probes = get_squares_around(square, ignore_squares_white);
					}

					moves = moves.concat(probes);
					break;
				case 3:
					probes = [];

					var ignore_squares_white = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
						{
							rank_offset: -1,
							file_offset: -1,
						},
						{
							rank_offset: -1,
							file_offset: 1,
						},
					];

					var ignore_squares_black = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
						{
							rank_offset: 1,
							file_offset: -1,
						},
						{
							rank_offset: 1,
							file_offset: 1,
						},
					];

					if (src.piece.color === BLACK) {
						probes = get_squares_around(square, ignore_squares_black);
					} else {
						probes = get_squares_around(square, ignore_squares_white);
					}

					moves = moves.concat(probes);
					break;
			}
			break;
		case LIEUTENANT_GENERAL:
			switch (src.tier) {
				case 1:
					probes = [];

					var ignore_squares_white = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
						{
							rank_offset: 0,
							file_offset: -1,
						},
						{
							rank_offset: 0,
							file_offset: 1,
						},
						{
							rank_offset: -1,
							file_offset: 0,
						},
					];

					var ignore_squares_black = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
						{
							rank_offset: 0,
							file_offset: -1,
						},
						{
							rank_offset: 0,
							file_offset: 1,
						},
						{
							rank_offset: 1,
							file_offset: 0,
						},
					];

					if (src.piece.color === BLACK) {
						probes = get_squares_around(square, ignore_squares_black);
					} else {
						probes = get_squares_around(square, ignore_squares_white);
					}

					moves = moves.concat(probes);
					break;
				case 2:
					probes = [];

					var ignore_squares = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
						{
							rank_offset: 0,
							file_offset: -1,
						},
						{
							rank_offset: 0,
							file_offset: 1,
						},
					];

					probes = get_squares_around(square, ignore_squares);
					moves = moves.concat(probes);
					break;
				case 3:
					probes = [];

					var ignore_squares = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
					];

					probes = get_squares_around(square, ignore_squares);
					moves = moves.concat(probes);
					break;
			}
			break;
		case GENERAL:
			switch (src.tier) {
				case 1:
					probes = [];

					var ignore_squares_white = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
						{
							rank_offset: -1,
							file_offset: -1,
						},
						{
							rank_offset: -1,
							file_offset: 1,
						},
					];

					var ignore_squares_black = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
						{
							rank_offset: 1,
							file_offset: -1,
						},
						{
							rank_offset: 1,
							file_offset: 1,
						},
					];

					if (src.piece.color === BLACK) {
						probes = get_squares_around(square, ignore_squares_black);
					} else {
						probes = get_squares_around(square, ignore_squares_white);
					}

					moves = moves.concat(probes);
					break;
				case 2:
					probes = [];

					var ignore_squares = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
					];

					probes = get_squares_around(square, ignore_squares);
					moves = moves.concat(probes);
					break;
				case 3:
					probes = [];

					var ignore_squares = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
					];

					probes = get_squares_around(square, ignore_squares);

					if (src.piece.color === BLACK) {
						if (
							!isSquareOutOfBounds(rank - 2, file - 1) &&
							!get_top(board, rank - 1 + '-' + (file - 1))
						) {
							probes.push({
								rank: rank - 2,
								file: file - 1,
							});
						}
						if (
							!isSquareOutOfBounds(rank - 2, file) &&
							!get_top(board, rank - 1 + '-' + file)
						) {
							probes.push({
								rank: rank - 2,
								file: file,
							});
						}
						if (
							!isSquareOutOfBounds(rank - 2, file + 1) &&
							!get_top(board, rank - 1 + '-' + (file + 1))
						) {
							probes.push({
								rank: rank - 2,
								file: file + 1,
							});
						}
					} else {
						if (
							!isSquareOutOfBounds(rank + 2, file - 1) &&
							!get_top(board, rank + 1 + '-' + (file - 1))
						) {
							probes.push({
								rank: rank + 2,
								file: file - 1,
							});
						}
						if (
							!isSquareOutOfBounds(rank + 2, file) &&
							!get_top(board, rank + 1 + '-' + file)
						) {
							probes.push({
								rank: rank + 2,
								file: file,
							});
						}
						if (
							!isSquareOutOfBounds(rank + 2, file + 1) &&
							!get_top(board, rank + 1 + '-' + (file + 1))
						) {
							probes.push({
								rank: rank + 2,
								file: file + 1,
							});
						}
					}

					moves = moves.concat(probes);
					break;
			}
			break;
		case ARCHER:
			switch (src.tier) {
				case 1:
					probes = [];

					var ignore_squares = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
					];

					probes = get_squares_around(square, ignore_squares);
					moves = moves.concat(probes);
					break;
				case 2:
					probes = [];

					for (var i = 0; i < 4; i++) {
						if (!isSquareOutOfBounds(rank - 2, file + 2 - i)) {
							probes.push({
								rank: rank - 2,
								file: file + 2 - i,
							});
						}
						if (!isSquareOutOfBounds(rank - 2 + i, file - 2)) {
							probes.push({
								rank: rank - 2 + i,
								file: file - 2,
							});
						}
						if (!isSquareOutOfBounds(rank + 2, file - 2 + i)) {
							probes.push({
								rank: rank + 2,
								file: file - 2 + i,
							});
						}
						if (!isSquareOutOfBounds(rank + 2 - i, file + 2)) {
							probes.push({
								rank: rank + 2 - i,
								file: file + 2,
							});
						}
					}

					moves = moves.concat(probes);
					break;
				case 3:
					probes = [];

					for (var i = 0; i < 6; i++) {
						if (!isSquareOutOfBounds(rank - 3, file + 3 - i)) {
							probes.push({
								rank: rank - 3,
								file: file + 3 - i,
							});
						}
						if (!isSquareOutOfBounds(rank - 3 + i, file - 3)) {
							probes.push({
								rank: rank - 3 + i,
								file: file - 3,
							});
						}
						if (!isSquareOutOfBounds(rank + 3, file - 3 + i)) {
							probes.push({
								rank: rank + 3,
								file: file - 3 + i,
							});
						}
						if (!isSquareOutOfBounds(rank + 3 - i, file + 3)) {
							probes.push({
								rank: rank + 3 - i,
								file: file + 3,
							});
						}
					}

					moves = moves.concat(probes);
					break;
			}
			break;
		case KNIGHT:
			switch (src.tier) {
				case 1:
					probes = [];

					if (src.piece.color === BLACK) {
						if (!isSquareOutOfBounds(rank, file - 1)) {
							probes.push({
								rank: rank,
								file: file - 1,
							});
						}
						if (!isSquareOutOfBounds(rank, file + 1)) {
							probes.push({
								rank: rank,
								file: file + 1,
							});
						}
						if (!isSquareOutOfBounds(rank - 2, file - 1)) {
							probes.push({
								rank: rank - 2,
								file: file - 1,
							});
						}
						if (!isSquareOutOfBounds(rank - 2, file + 1)) {
							probes.push({
								rank: rank - 2,
								file: file + 1,
							});
						}
					} else {
						if (!isSquareOutOfBounds(rank, file - 1)) {
							probes.push({
								rank: rank,
								file: file - 1,
							});
						}
						if (!isSquareOutOfBounds(rank, file + 1)) {
							probes.push({
								rank: rank,
								file: file + 1,
							});
						}
						if (!isSquareOutOfBounds(rank + 2, file - 1)) {
							probes.push({
								rank: rank + 2,
								file: file - 1,
							});
						}
						if (!isSquareOutOfBounds(rank + 2, file + 1)) {
							probes.push({
								rank: rank + 2,
								file: file + 1,
							});
						}
					}

					moves = moves.concat(probes);
					break;
				case 2:
					probes = [];

					if (src.piece.color === BLACK) {
						if (!isSquareOutOfBounds(rank - 1, file - 2)) {
							probes.push({
								rank: rank - 1,
								file: file - 2,
							});
						}
						if (!isSquareOutOfBounds(rank - 2, file - 1)) {
							probes.push({
								rank: rank - 2,
								file: file - 1,
							});
						}
						if (!isSquareOutOfBounds(rank - 2, file + 1)) {
							probes.push({
								rank: rank - 2,
								file: file + 1,
							});
						}
						if (!isSquareOutOfBounds(rank - 1, file + 2)) {
							probes.push({
								rank: rank - 1,
								file: file + 2,
							});
						}
					} else {
						if (!isSquareOutOfBounds(rank + 1, file - 2)) {
							probes.push({
								rank: rank + 1,
								file: file - 2,
							});
						}
						if (!isSquareOutOfBounds(rank + 2, file - 1)) {
							probes.push({
								rank: rank + 2,
								file: file - 1,
							});
						}
						if (!isSquareOutOfBounds(rank + 2, file + 1)) {
							probes.push({
								rank: rank + 2,
								file: file + 1,
							});
						}
						if (!isSquareOutOfBounds(rank + 1, file + 2)) {
							probes.push({
								rank: rank + 1,
								file: file + 2,
							});
						}
					}

					moves = moves.concat(probes);
					break;
				case 3:
					probes = [];

					if (!isSquareOutOfBounds(rank - 1, file - 2)) {
						probes.push({
							rank: rank - 1,
							file: file - 2,
						});
					}
					if (!isSquareOutOfBounds(rank - 2, file - 1)) {
						probes.push({
							rank: rank - 2,
							file: file - 1,
						});
					}
					if (!isSquareOutOfBounds(rank - 2, file + 1)) {
						probes.push({
							rank: rank - 2,
							file: file + 1,
						});
					}
					if (!isSquareOutOfBounds(rank - 1, file + 2)) {
						probes.push({
							rank: rank - 1,
							file: file + 2,
						});
					}

					if (!isSquareOutOfBounds(rank + 1, file - 2)) {
						probes.push({
							rank: rank + 1,
							file: file - 2,
						});
					}
					if (!isSquareOutOfBounds(rank + 2, file - 1)) {
						probes.push({
							rank: rank + 2,
							file: file - 1,
						});
					}
					if (!isSquareOutOfBounds(rank + 2, file + 1)) {
						probes.push({
							rank: rank + 2,
							file: file + 1,
						});
					}
					if (!isSquareOutOfBounds(rank + 1, file + 2)) {
						probes.push({
							rank: rank + 1,
							file: file + 2,
						});
					}

					moves = moves.concat(probes);
					break;
			}
			break;
		case MUSKETEER:
			switch (src.tier) {
				case 1:
					probes = [];

					if (src.piece.color === BLACK) {
						if (!isSquareOutOfBounds(rank - 1, file)) {
							probes.push({
								rank: rank - 1,
								file: file,
							});
						}
					} else {
						if (!isSquareOutOfBounds(rank + 1, file)) {
							probes.push({
								rank: rank + 1,
								file: file,
							});
						}
					}

					moves = moves.concat(probes);
					break;
				case 2:
					if (src.piece.color === BLACK) {
						probes = probe_directions(board, square, 2, [
							false,
							false,
							false,
							true,
							false,
							false,
							false,
							false,
						]);
						moves = moves.concat(probes);
					} else {
						probes = probe_directions(board, square, 2, [
							false,
							false,
							true,
							false,
							false,
							false,
							false,
							false,
						]);
						moves = moves.concat(probes);
					}
					break;
				case 3:
					if (src.piece.color === BLACK) {
						probes = probe_directions(board, square, 8, [
							false,
							false,
							false,
							true,
							false,
							false,
							false,
							false,
						]);
						moves = moves.concat(probes);
					} else {
						probes = probe_directions(board, square, 8, [
							false,
							false,
							true,
							false,
							false,
							false,
							false,
							false,
						]);
						moves = moves.concat(probes);
					}
					break;
			}
			break;
		case CAPTAIN:
			switch (src.tier) {
				case 1:
					probes = [];

					var ignore_squares = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
					];

					probes = get_squares_around(square, ignore_squares);
					moves = moves.concat(probes);
					break;
				case 2:
				case 3:
					var piece_under = get(board, square)[src.tier - 2];

					if (piece_under) {
						if (piece_under.type === CAPTAIN) {
							var deep_piece_under = get(board, square)[src.tier - 3];

							if (deep_piece_under) {
								moves = moves.concat(
									single_sqaure_move_gen(
										board,
										{
											piece: {
												type: deep_piece_under.type,
												color: src.piece.color,
											},
											tier: src.tier,
										},
										square
									)
								);
							} else {
								probes = [];

								var ignore_squares = [
									{
										rank_offset: 0,
										file_offset: 0,
									},
								];

								probes = get_squares_around(square, ignore_squares);
								moves = moves.concat(probes);
							}
						} else {
							moves = moves.concat(
								single_sqaure_move_gen(
									board,
									{
										piece: { type: piece_under.type, color: src.piece.color },
										tier: src.tier,
									},
									square
								)
							);
						}
					}
					break;
			}
			break;
		case SAMURAI:
			switch (src.tier) {
				case 1:
					probes = [];

					if (!isSquareOutOfBounds(rank + 1, file - 1)) {
						probes.push({
							rank: rank + 1,
							file: file - 1,
						});
					}
					if (!isSquareOutOfBounds(rank + 1, file + 1)) {
						probes.push({
							rank: rank + 1,
							file: file + 1,
						});
					}
					if (!isSquareOutOfBounds(rank - 1, file - 1)) {
						probes.push({
							rank: rank - 1,
							file: file - 1,
						});
					}
					if (!isSquareOutOfBounds(rank - 1, file + 1)) {
						probes.push({
							rank: rank - 1,
							file: file + 1,
						});
					}

					moves = moves.concat(probes);
					break;
				case 2:
					probes = [];

					if (!isSquareOutOfBounds(rank + 2, file - 2)) {
						probes.push({
							rank: rank + 2,
							file: file - 2,
						});
					}
					if (!isSquareOutOfBounds(rank + 2, file + 2)) {
						probes.push({
							rank: rank + 2,
							file: file + 2,
						});
					}
					if (!isSquareOutOfBounds(rank - 2, file - 2)) {
						probes.push({
							rank: rank - 2,
							file: file - 2,
						});
					}
					if (!isSquareOutOfBounds(rank - 2, file + 2)) {
						probes.push({
							rank: rank - 2,
							file: file + 2,
						});
					}

					moves = moves.concat(probes);
					break;
				case 3:
					probes = probe_directions(board, square, 8, [
						false,
						false,
						false,
						false,
						true,
						true,
						true,
						true,
					]);

					moves = moves.concat(probes);
					break;
			}
			break;
		case FORTRESS:
			probes = [];

			var ignore_squares = [
				{
					rank_offset: 0,
					file_offset: 0,
				},
			];

			probes = get_squares_around(square, ignore_squares);
			moves = moves.concat(probes);
			break;
		case CANNON:
			switch (src.tier) {
				case 1:
					probes = [];

					if (!isSquareOutOfBounds(rank, file - 1)) {
						probes.push({
							rank: rank,
							file: file - 1,
						});
					}
					if (!isSquareOutOfBounds(rank, file + 1)) {
						probes.push({
							rank: rank,
							file: file + 1,
						});
					}
					if (!isSquareOutOfBounds(rank - 1, file)) {
						probes.push({
							rank: rank - 1,
							file: file,
						});
					}
					if (!isSquareOutOfBounds(rank + 1, file)) {
						probes.push({
							rank: rank + 1,
							file: file,
						});
					}

					moves = moves.concat(probes);
					break;
				case 2:
					probes = probe_directions(board, square, 2, [
						true,
						true,
						true,
						true,
						false,
						false,
						false,
						false,
					]);

					moves = moves.concat(probes);
					break;
				case 3:
					probes = probe_directions(board, square, 8, [
						true,
						true,
						true,
						true,
						false,
						false,
						false,
						false,
					]);

					moves = moves.concat(probes);
					break;
			}
			break;
		case SPY:
			switch (src.tier) {
				case 1:
					probes = [];

					if (src.piece.color === BLACK) {
						if (!isSquareOutOfBounds(rank - 1, file)) {
							probes.push({
								rank: rank - 1,
								file: file,
							});
						}
					} else {
						if (!isSquareOutOfBounds(rank + 1, file)) {
							probes.push({
								rank: rank + 1,
								file: file,
							});
						}
					}

					moves = moves.concat(probes);
					break;
				case 2:
					probes = [];

					if (!isSquareOutOfBounds(rank + 1, file - 1)) {
						probes.push({
							rank: rank + 1,
							file: file - 1,
						});
					}
					if (!isSquareOutOfBounds(rank + 1, file + 1)) {
						probes.push({
							rank: rank + 1,
							file: file + 1,
						});
					}
					if (!isSquareOutOfBounds(rank - 1, file - 1)) {
						probes.push({
							rank: rank - 1,
							file: file - 1,
						});
					}
					if (!isSquareOutOfBounds(rank - 1, file + 1)) {
						probes.push({
							rank: rank - 1,
							file: file + 1,
						});
					}

					moves = moves.concat(probes);
					break;
				case 3:
					probes = probe_directions(board, square, 8, [
						true,
						true,
						true,
						true,
						true,
						true,
						true,
						true,
					]);

					moves = moves.concat(probes);
					break;
			}
			break;
		case PAWN:
			switch (src.tier) {
				case 1:
					probes = [];

					if (src.piece.color === BLACK) {
						if (!isSquareOutOfBounds(rank - 1, file)) {
							probes.push({
								rank: rank - 1,
								file: file,
							});
						}
					} else {
						if (!isSquareOutOfBounds(rank + 1, file)) {
							probes.push({
								rank: rank + 1,
								file: file,
							});
						}
					}

					moves = moves.concat(probes);
					break;
				case 2:
				case 3:
					probes = [];

					if (src.piece.color === BLACK) {
						if (!isSquareOutOfBounds(rank - 1, file)) {
							probes.push({
								rank: rank - 1,
								file: file,
							});
						}
						if (!isSquareOutOfBounds(rank - 1, file - 1)) {
							probes.push({
								rank: rank - 1,
								file: file - 1,
							});
						}
						if (!isSquareOutOfBounds(rank - 1, file + 1)) {
							probes.push({
								rank: rank - 1,
								file: file + 1,
							});
						}
					} else {
						if (!isSquareOutOfBounds(rank + 1, file)) {
							probes.push({
								rank: rank + 1,
								file: file,
							});
						}
						if (!isSquareOutOfBounds(rank + 1, file - 1)) {
							probes.push({
								rank: rank + 1,
								file: file - 1,
							});
						}
						if (!isSquareOutOfBounds(rank + 1, file + 1)) {
							probes.push({
								rank: rank + 1,
								file: file + 1,
							});
						}
					}

					moves = moves.concat(probes);
					break;
			}
			break;
		case MARSHAL:
			switch (src.tier) {
				case 1:
				case 2:
				case 3:
					probes = [];

					var ignore_squares = [
						{
							rank_offset: 0,
							file_offset: 0,
						},
					];

					probes = get_squares_around(square, ignore_squares);
					moves = moves.concat(probes);
					break;
			}
			break;
	}

	return moves;
};
