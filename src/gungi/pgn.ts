// Portable Game Notation (PGN) parser and serializer for Gungi games.
// Read more about PGN for chess: https://en.wikipedia.org/wiki/Portable_Game_Notation
//
// Movetext
// The movetext describes the actual moves of the game. This includes move number indicators (numbers followed by either one or three periods;
// one if the next move is White's move, three if the next move is Black's move) and movetext in Standard Algebraic Notation (SAN).
//
// For most moves the SAN consists of the kanji for the piece, the coordinate tuple of the square the piece moved from, an 取 if there is a capture, and the tuple of the final square it moved to.
// The kanji are 帥 (marshal), 大 (general), 中 (lieutenant general), 小 (major general), 侍 (warrior), 槍 (lancer), 馬 (rider), 忍 (spy), 砦 (fortress), 兵 (soldier),
// 砲 (cannon), 弓 (archer), 筒 (musketeer), and 謀 (tactician).
//
// The algebraic name of any square is a little different from algebraic chess notation; from white's perspective,
// the rightmost square farthest from white is (1-1-1), the leftmost square farthest from the white is (9-1-1), and the leftmost (from white's perspective) square closest to white's side is (9-9-1).
// the coordinates are given in the from (rank-file-tier) where tier can be (1, 2, or 3) depending on the height of the tower. If performing a stack ツケ (tsuke) then 付 is appended.
// Thus 中(4-9-1)(5-8-2)付 denotes the major general stacking on a piece, and if we wanted to take the piece instead, we would write 中(4-9-1)取(5-8-1).
//
// Omitting the from square and prepending 新 to the piece indicates arata - a new piece is being placed on the board (e.g. 新小(8-7-1)) . In non-beginner games,
// all the first moves are of this form until both players say they are finished placing pieces;
// If a player is finished, after they place their final piece in their setup, 終 is appended (e.g. 新兵(4-2-1)終).
//
// If the tactician performs a ツケ (tsuke), they have the option to convert some or all of the enemy pieces in the tower.
// (only if they have the piece in their hand they capture the enemy piece and replaces it with their own); this is denoted by a '返'
// after the last coordinate followed by the piece(s) they are converting (in no particular order). Thus 謀(4-9-2)(5-8-3)返中槍 denotes
// the tactician converting a major general and a lancer in a tower.
//
// If the move captures the enemy marshal, "勝" is appended and the game is over.
// If the move is a fourfold repetition, "停" is appended and the game is a draw.

import { parseFEN } from './fen';
import { Move } from './utils';

export type PGNOptions = {
	maxWidth?: number;
	newline?: string;
};

export function encodePGN(history: Move[], opts?: PGNOptions) {
	const maxWidth = opts?.maxWidth ?? 6;
	const newline = opts?.newline ?? '\n';

	let pgn = '';
	let prev = 0;
	history.forEach((move, i) => {
		const state = parseFEN(move.before);
		if (state.moveNumber !== prev) {
			const indicator = move.color === 'w' ? '.' : '...';
			pgn += `${state.moveNumber}${indicator} `;
			prev = state.moveNumber;
		}

		pgn += `${move.san} `;

		if ((i + 1) % maxWidth === 0) {
			pgn += newline;
		}
	});

	return pgn.replaceAll('  ', ' ').trim();
}

export function parsePGN(pgn: string, opts?: Pick<PGNOptions, 'newline'>) {
	const newline = opts?.newline ?? '\n';
	const moves = pgn
		.split(newline)
		.flatMap((line) => {
			return line.replace(/\d+\.+/g, '').split(' ');
		})
		.filter((move) => move !== '');

	return moves;
}
