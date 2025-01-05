// Forsyth–Edwards Notation (FEN) Parser and Serializer for Gungi games.
// Read more about FEN for chess: https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
//
// Gungi FEN will have
// 1. Piece placement data:
//    Each rank is described, starting with rank 1 and ending with rank 9, with a '/' between each one; within each rank,
//    the contents of the squares are described from file 9 to file 1; within each square the tower is described
//    from bottom to top (towers of 2 or higher are surrounded with a '|' with ':' in between pices).
//    Each pieces is represented by a single character from the standard English names
//
//    帥 marshal = m
//    大 general = g
//    中 lieutenant_general = i
//    小 major_general = j
//    侍 warrior = w
//    槍 lancer = n
//    馬 rider = r
//    忍 spy = s
//    砦 fortress = f
//    兵 soldier = d
//    砲 cannon = c
//    弓 archer = a
//    筒 musketeer = k
//    謀 tactician = t
//
//    Black pieces are designated using lowercase ("mgljwcrsfdnakt"),
//    while white pieces use uppercase ("MGLJWCRSFDNAKT")
//
//    A set of one or more consecutive empty squares within a rank is denoted by a digit from "1" to "9", corresponding to the number of squares.
// 2: Active player:
//    "w" means that White is to move; "b" means that Black is to move.
// 3: Setup mode:
//    "0" means intro placement, "1" for Beginner, "2" for Intermediate, "3" for Advanced
// 4: Drafting:
//    "0" means no longer drafting, "1" means in drafting stage
// 5: Full move number:
//    The number of the full moves. It starts at 1 and is incremented after Black's move.
//
// Examples
//
// FEN for the starting position of a beginner game of gungi:
// "3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 w 1 0 1"
// and after the move 1.大(6-9-1)(5-8-2)付:
// "3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1|N:G|1AR1/4MI3 b 1 0 1"
// and then after 1...槍(5-2-1)(4-3-2)付:
// "3img3/1ra3as1/d1fwd|w:n|f1d/9/9/9/D1FWDWF1D/1SA1|N:G|1AR1/4MI3 w 1 0 2"
// and then after 2.新忍(3-8-2)付
// "3img3/1ra3as1/d1fwd|w:n|f1d/9/9/9/D1FWDWF1D/1SA1|N:G|1|A:S|R1/4MI3 b 1 0 2"

import {
	Board,
	Color,
	createPieceFromFenCode,
	Piece,
	PieceCode,
	pieceToFenCode,
	PieceType,
	setupCodeToMode,
	SetupMode,
	setupModeToCode,
	symbolToName,
} from './utils';

export const INTRO_FEN =
	'3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWDWF1D/1S2N2S1/3GMI3 w 0 0 1';
export const BEGINNNER_FEN =
	'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 w 1 0 1';
export const INTERMEDIATE_FEN = '9/9/9/9/9/9/9/9/9 w 2 0 1';
export const ADVANCED_FEN = '9/9/9/9/9/9/9/9/9 w 3 0 1';

type ParsedFEN = {
	board: Board;
	turn: Color;
	mode: SetupMode;
	draft: boolean;
	fullmoves: number;
};

export const parseFEN = (fen: string): ParsedFEN => {
	const [placement, turn, mode, draft, fullmoves] = fen.split(' ');

	const board = placement.split('/').map((rank) => {
		return rank.split('|').reduce(
			(outeracc, partial) => {
				if (partial.includes(':')) {
					const tower = partial.split(':').map((piece) => {
						return createPieceFromFenCode(
							piece as PieceCode | Uppercase<PieceCode>
						);
					});
					outeracc.push(tower);
				} else {
					const partialPieces = partial
						.split('')
						.reduce(
							(acc, piece) => {
								if (Number.isInteger(+piece)) {
									acc = acc.concat(Array(+piece).fill(null));
								} else {
									acc.push(
										createPieceFromFenCode(
											piece as PieceCode | Uppercase<PieceCode>
										)
									);
								}

								return acc;
							},
							[] as (Piece | null)[]
						)
						.map((square) => [square]);
					outeracc = outeracc.concat(partialPieces);
				}

				return outeracc;
			},
			[] as (Piece | null)[][]
		);
	});

	return {
		board,
		turn: turn as Color,
		mode: setupCodeToMode[+mode],
		draft: Boolean(+draft),
		fullmoves: +fullmoves,
	};
};

export const encodeFEN = (fen: ParsedFEN): string => {
	let placement = '';
	let emptyCount = 0;

	for (let file = 0; file < 9; file++) {
		for (let rank = 0; rank < 9; rank++) {
			const square = fen.board[file][rank];
			if (square[0] === null) {
				emptyCount++;
				continue;
			}

			if (emptyCount) {
				placement += emptyCount;
				emptyCount = 0;
			}

			if (square.length > 1) {
				placement +=
					'|' +
					square
						.map((p) => {
							if (!p) return null;
							const [color, type] = p.split('') as [Color, PieceType];
							const piece = pieceToFenCode[symbolToName[type]];
							return color === 'w' ? piece.toUpperCase() : piece;
						})
						.join(':') +
					'|';
			} else {
				const [color, type] = square[0].split('') as [Color, PieceType];
				const piece = pieceToFenCode[symbolToName[type]];
				placement += color === 'w' ? piece.toUpperCase() : piece;
			}
		}

		placement += emptyCount ? `${emptyCount}/` : '/';
		emptyCount = 0;
	}

	return `${placement.slice(0, -1)} ${fen.turn} ${setupModeToCode[fen.mode]} ${+fen.draft} ${fen.fullmoves}`;
};
