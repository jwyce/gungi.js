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
//    Black pieces are designated using lowercase ("mgijwnrsfdcakt"),
//    while white pieces use uppercase ("MGIJWNRSFDCAKT")
//
//    A set of one or more consecutive empty squares within a rank is denoted by a digit from "1" to "9", corresponding to the number of squares.
// 2: Hand piece data:
//    Each piece in hand is represented by a single character (see above) followed by the number of that piece in hand (1-9);
//    white's hand piecs come first followed by black's separated by a '/'. if a player has no pieces in hand, it's represented with the character '-'
// 3: Active player:
//    "w" means that White is to move; "b" means that Black is to move.
// 4: Setup mode:
//    "0" means intro placement, "1" for Beginner, "2" for Intermediate, "3" for Advanced
// 5: Drafting availability:
//    If neither side has the ability to draft, this field uses the character "-". Otherwise, this field contains one or more letters: "w" if White can draft and 'b' if Black can draft
// 6: Full move number:
//    The number of the full moves. It starts at 1 and is incremented after Black's move.
//
// Examples
//
// FEN for the starting position of a beginner game of gungi:
// "3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1"
// and after the move 1.大(6-9-1)(5-8-2)付:
// "3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1|N:G|1AR1/4MI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 1"
// and then after 1...槍(5-2-1)(4-3-2)付:
// "3img3/1ra3as1/d1fwd|w:n|f1d/9/9/9/D1FWDWF1D/1SA1|N:G|1AR1/4MI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 2"
// and then after 2.新忍(3-8-2)付
// "3img3/1ra3as1/d1fwd|w:n|f1d/9/9/9/D1FWDWF1D/1SA1|N:G|1|A:S|R1/4MI3 J2N2R1D1/j2n2s1r1d1 b 1 - 2"

import {
	Board,
	Color,
	createHandPieceFromFenCode,
	createPieceFromFenCode,
	HandPiece,
	Piece,
	PieceCode,
	pieceToFenCode,
	setupCodeToMode,
	SetupMode,
	setupModeToCode,
	symbolToName,
} from './utils';

export const INTRO_POSITION =
	'3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWDWF1D/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 w 0 - 1';
export const BEGINNER_POSITION =
	'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1';
export const INTERMEDIATE_POSITION =
	'9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 2 wb 1';
export const ADVANCED_POSITION =
	'9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 3 wb 1';

export type ParsedFEN = {
	board: Board;
	hand: HandPiece[];
	turn: Color;
	mode: SetupMode;
	drafting: Record<Color, boolean>;
	moveNumber: number;
};

export function parseFEN(fen: string): ParsedFEN {
	const result = validateFen(fen);
	if (!result.ok) throw new Error(`Invalid FEN: ${result.error}`);

	const [placement, handpieces, turn, mode, drafting, moveNumber] =
		fen.split(' ');

	const board = placement.split('/').map((rank, y) => {
		return rank.split('|').reduce(
			(outeracc, partial) => {
				if (partial.includes(':')) {
					const tower = partial.split(':').map((piece, z) => {
						return createPieceFromFenCode(
							piece as PieceCode | Uppercase<PieceCode>,
							[y + 1, 9 - outeracc.length, z + 1]
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
											piece as PieceCode | Uppercase<PieceCode>,
											[y + 1, 9 - outeracc.length - acc.length, 1]
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

	const hand = handpieces.split('/').flatMap((playerHand) => {
		const pieces: HandPiece[] = [];
		if (playerHand !== '-') {
			for (let i = 0; i < playerHand.length; i += 2) {
				const piece = playerHand[i] as PieceCode | Uppercase<PieceCode>;
				const count = +playerHand[i + 1];
				pieces.push(createHandPieceFromFenCode(piece, count));
			}
		}
		return pieces;
	});

	return {
		board,
		hand,
		turn: turn as Color,
		mode: setupCodeToMode[+mode],
		drafting: {
			w: drafting.includes('w'),
			b: drafting.includes('b'),
		},
		moveNumber: +moveNumber,
	};
}

export function encodeFEN(fen: ParsedFEN) {
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
							const piece = pieceToFenCode[symbolToName[p.type]];
							return p.color === 'w' ? piece.toUpperCase() : piece;
						})
						.join(':') +
					'|';
			} else {
				const { type, color } = square[0];
				const piece = pieceToFenCode[symbolToName[type]];
				placement += color === 'w' ? piece.toUpperCase() : piece;
			}
		}

		placement += emptyCount ? `${emptyCount}/` : '/';
		emptyCount = 0;
	}

	let hand = '';
	const whiteHand = fen.hand.filter((p) => p.color === 'w');
	const blackHand = fen.hand.filter((p) => p.color === 'b');
	whiteHand.forEach((p) => {
		const piece = pieceToFenCode[symbolToName[p.type]];
		hand += `${p.color === 'w' ? piece.toUpperCase() : piece}${p.count}`;
	});
	hand += whiteHand.length > 0 ? '/' : '-/';
	blackHand.forEach((p) => {
		const piece = pieceToFenCode[symbolToName[p.type]];
		hand += `${p.color === 'w' ? piece.toUpperCase() : piece}${p.count}`;
	});
	hand += blackHand.length > 0 ? '' : '-';

	const draftKeys = Object.keys(fen.drafting).filter(
		(key) => fen.drafting[key as Color]
	);

	return `${placement.slice(0, -1)} ${hand} ${fen.turn} ${setupModeToCode[fen.mode]} ${draftKeys.length > 0 ? draftKeys.join('') : '-'} ${fen.moveNumber}`;
}

type FenValidationResult = {
	ok: boolean;
	error?: string;
};

export function validateFen(fen: string): FenValidationResult {
	const parts = fen.split(' ');
	if (parts.length !== 6)
		return { ok: false, error: `expected 6 fields, received ${parts.length}` };

	const [placement, handpieces, turn, mode, drafting, moveNumber] = parts;
	const ranks = placement.split('/');
	if (ranks.length !== 9)
		return {
			ok: false,
			error: `1st field (piece positions) is invalid [expected 9 ranks, received ${ranks.length}]`,
		};

	for (let i = 0; i < ranks.length; i++) {
		const rank = ranks[i];
		const fileParts = rank.split('|');
		let fileCount = 0;

		for (let k = 0; k < fileParts.length; k++) {
			const filePart = fileParts[k];
			if (filePart.includes(':')) {
				fileCount++;
				const towerPieces = filePart.split(':');
				if (towerPieces.length > 3) {
					return {
						ok: false,
						error: `1st field (piece positions) is invalid [tower size] @(${i + 1}-${fileCount})`,
					};
				}
				if (
					!towerPieces.every((p) => 'mgijwnrsfdcaktMGIJWNRSFDCAKT'.includes(p))
				) {
					return {
						ok: false,
						error: `1st field (piece positions) is invalid [invalid piece] @(${i + 1}-${fileCount})`,
					};
				}
			} else {
				const pieces = filePart.split('');

				for (let l = 0; l < pieces.length; l++) {
					const piece = pieces[l];

					if (Number.isInteger(+piece)) {
						fileCount += +piece;
					} else {
						fileCount++;
						if (!'mgijwnrsfdcaktMGIJWNRSFDCAKT'.includes(piece)) {
							return {
								ok: false,
								error: `1st field (piece positions) is invalid [invalid piece] @(${i + 1}-${fileCount})`,
							};
						}
					}
				}
			}
		}
		if (fileCount !== 9) {
			return {
				ok: false,
				error: `1st field (piece positions) is invalid [expected 9 squares, received ${fileCount}] in rank: ${i + 1}`,
			};
		}
	}

	const hands = handpieces.split('/');
	if (hands.length !== 2)
		return {
			ok: false,
			error: `2nd field (hand pieces) is invalid [expected 2 hands, received ${hands.length}]`,
		};

	const [whiteHand, blackHand] = hands;
	if (
		(whiteHand.length === 1 && whiteHand !== '-') ||
		(blackHand.length === 1 && blackHand !== '-')
	) {
		return {
			ok: false,
			error: `2nd field (hand pieces) is invalid [invalid piece]`,
		};
	}

	if (
		(whiteHand.length > 1 && whiteHand.length % 2 !== 0) ||
		(blackHand.length > 1 && blackHand.length % 2 !== 0)
	) {
		return {
			ok: false,
			error: `2nd field (hand pieces) is invalid [invalid piece count]`,
		};
	}

	if (whiteHand.length > 1) {
		for (let i = 0; i < whiteHand.length; i += 2) {
			if (!'MGIJWNRSFDCAKT'.includes(whiteHand[i])) {
				return {
					ok: false,
					error: `2nd field (hand pieces) is invalid [invalid piece]`,
				};
			}
			if (!Number.isInteger(+whiteHand[i + 1])) {
				return {
					ok: false,
					error: `2nd field (hand pieces) is invalid [invalid count]`,
				};
			}
		}
	}

	if (blackHand.length > 1) {
		for (let i = 0; i < blackHand.length; i += 2) {
			if (!'mgijwnrsfdcakt'.includes(blackHand[i])) {
				return {
					ok: false,
					error: `2nd field (hand pieces) is invalid [invalid piece]`,
				};
			}
			if (!Number.isInteger(+blackHand[i + 1])) {
				return {
					ok: false,
					error: `2nd field (hand pieces) is invalid [invalid count]`,
				};
			}
		}
	}

	if (turn !== 'w' && turn !== 'b') {
		return {
			ok: false,
			error: `3rd field (active player) is invalid [expected 'w' or 'b', received ${turn}]`,
		};
	}

	if (mode.length !== 1 || !'0123'.includes(mode)) {
		return {
			ok: false,
			error: `4th field (setup mode) is invalid [expected '0', '1', '2', or '3', received ${mode}]`,
		};
	}

	if (drafting !== '-' && !'wb'.includes(drafting)) {
		return {
			ok: false,
			error: `5th field (drafting availability) is invalid [expected '-', 'w', 'b', or 'wb', received ${drafting}]`,
		};
	}

	if (!Number.isInteger(+moveNumber)) {
		return {
			ok: false,
			error: `6th field (full move number) is invalid [expected an integer, received ${moveNumber}]`,
		};
	}

	return { ok: true };
}
