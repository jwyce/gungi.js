import pc from 'picocolors';
import { BEGINNNER_FEN, parseFEN } from './fen';
import { Board, Color, PieceType } from './utils';

type PGN = {
	date: string;
	white: string;
	black: string;
	result: string;
	fen: string;
	movetext: string;
};

type Options = {
	pgn?: PGN;
	fen?: string;
};

export class Gungi {
	#board: Board;

	constructor(opts?: Options) {
		this.#board = parseFEN(opts?.fen ?? BEGINNNER_FEN).board;
	}

	get_top(rank: number, file: number) {
		const square = this.#board[file][rank].at(-1);
		if (!square) return null;

		const [color, piece] = square.split('') as [Color, PieceType];

		return {
			color,
			piece,
			tier: this.#board[file][rank].length,
		};
	}

	print() {
		const tierToColor = {
			1: pc.yellow,
			2: pc.blue,
			3: pc.green,
		} as const;

		let s = `　９８７６５４３２１　\n`;
		s += `＋ーーーーーーーーー＋\n`;
		for (let file = 0; file < 9; file++) {
			s += `｜`;
			for (let rank = 0; rank < 9; rank++) {
				const square = this.get_top(rank, file);
				if (!square) {
					s += '・';
					continue;
				}

				const coloredPiece = tierToColor[square.tier as 1 | 2 | 3](
					square.piece
				);

				s += square.color === 'w' ? coloredPiece : pc.dim(coloredPiece);
			}
			s += `｜${String.fromCharCode(file + '１'.charCodeAt(0))}\n`;
		}
		s += `＋ーーーーーーーーー＋\n`;
		console.log(s);
	}
}
