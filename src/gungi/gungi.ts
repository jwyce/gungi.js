import pc from 'picocolors';
import {
	ADVANCED_POSITION,
	BEGINNNER_POSITION,
	encodeFEN,
	INTERMEDIATE_POSITION,
	INTRO_POSITION,
	ParsedFEN,
	parseFEN,
	validateFen,
} from './fen';
import { generateMovesForSquare } from './move_gen';
import {
	Board,
	Color,
	get,
	getTop,
	HandPiece,
	pieceToFenCode,
	SetupMode,
	symbolToName,
} from './utils';

export {
	INTRO_POSITION,
	BEGINNNER_POSITION,
	INTERMEDIATE_POSITION,
	ADVANCED_POSITION,
};

export class Gungi {
	#board!: Board;
	#hand!: HandPiece[];
	#turn!: Color;
	#moveNumber!: number;
	#drafting!: Record<Color, boolean>;
	#mode!: SetupMode;

	#initPosition: string;

	#initializeState({
		board,
		hand,
		turn,
		moveNumber,
		drafting,
		mode,
	}: ParsedFEN) {
		this.#board = board;
		this.#hand = hand;
		this.#turn = turn;
		this.#moveNumber = moveNumber;
		this.#drafting = drafting;
		this.#mode = mode;
	}

	constructor(fen?: string) {
		this.#initPosition = fen ?? INTRO_POSITION;
		this.#initializeState(parseFEN(this.#initPosition));
	}

	board() {
		return this.#board;
	}

	clear() {
		this.#initializeState(parseFEN(ADVANCED_POSITION));
	}

	fen() {
		return encodeFEN({
			board: this.#board,
			hand: this.#hand,
			turn: this.#turn,
			mode: this.#mode,
			drafting: this.#drafting,
			moveNumber: this.#moveNumber,
		});
	}

	get(square: string) {
		return get(square, this.#board);
	}

	getDraftingRights(color?: Color) {
		return color ? this.#drafting[color] : this.#drafting;
	}

	getTop(square: string) {
		return getTop(square, this.#board);
	}

	hand(color?: Color) {
		return color
			? this.#hand.filter((piece) => piece.color === color)
			: this.#hand;
	}

	inDraft() {
		return this.#drafting.b || this.#drafting.w;
	}

	load(fen: string) {
		this.#initializeState(parseFEN(fen));
	}

	moves(opts?: { square?: string; verbose?: boolean }) {
		if (opts?.square) {
			const moves = generateMovesForSquare(opts.square, this.fen());
			return opts.verbose ? moves : moves.map((move) => move.san);
		} else {
			return [];
		}
	}

	moveNumber() {
		return this.#moveNumber;
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
				const square = this.getTop(`${file}-${rank}`);
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

	reset() {
		this.#initializeState(parseFEN(this.#initPosition));
	}

	turn() {
		return this.#turn;
	}

	validateFen(fen: string) {
		return validateFen(fen);
	}
}
