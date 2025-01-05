import pc from 'picocolors';
import { encodeFEN, INTRO_POSITION, parseFEN } from './fen';
import { Board, File, pieceToFenCode, Rank, symbolToName } from './utils';

export class Gungi {
	#board: Board;

	constructor(fen?: string) {
		this.#board = parseFEN(fen ?? INTRO_POSITION).board;
	}

	board() {
		return this.#board;
	}

	get(pos: `${File}-${Rank}`) {
		const [file, rank] = pos.split('-').map(Number) as [File, Rank];
		const square = this.#board[file - 1][9 - rank];
		if (!square) return null;

		return square;
	}

	get_top(pos: `${File}-${Rank}`) {
		const [file, rank] = pos.split('-').map(Number) as [File, Rank];
		const square = this.#board[file - 1][9 - rank].at(-1);
		if (!square) return null;

		return square;
	}

	fen() {
		return encodeFEN({
			board: this.#board,
			turn: 'w',
			mode: 'intro',
			draft: false,
			fullmoves: 1,
		});
	}

	print(opts?: { english?: boolean }) {
		const tierToColor = {
			1: pc.yellow,
			2: pc.blue,
			3: pc.green,
		} as const;

		let s = `　９８７６５４３２１　\n`;
		s += `＋ーーーーーーーーー＋\n`;
		for (let file = 1; file <= 9; file++) {
			s += `｜`;
			for (let rank = 9; rank > 0; rank--) {
				const square = this.get_top(`${file as File}-${rank as Rank}`);
				if (!square) {
					s += '・';
					continue;
				}

				const code = pieceToFenCode[symbolToName[square.type]];
				const en = square.color === 'w' ? code.toUpperCase() : code;

				const coloredPiece = tierToColor[square.tier as 1 | 2 | 3](
					opts?.english
						? String.fromCharCode(en.charCodeAt(0) + 0xfee0)
						: square.type
				);

				s += square.color === 'w' ? coloredPiece : pc.dim(coloredPiece);
			}
			s += `｜${String.fromCharCode(file - 1 + '１'.charCodeAt(0))}\n`;
		}
		s += `＋ーーーーーーーーー＋\n`;
		console.log(s);
	}
}
