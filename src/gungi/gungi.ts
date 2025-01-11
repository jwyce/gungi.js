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
import { generateArata, generateMovesForSquare } from './move_gen';
import {
	Board,
	Color,
	get,
	getTop,
	HandPiece,
	isGameOver,
	Move,
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

	#history: Move[] = [];

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

	ascii(opts?: { english?: boolean }) {
		const tierToColor = {
			1: pc.yellow,
			2: pc.blue,
			3: pc.green,
		} as const;

		let s = `　９８７６５４３２１　\n`;
		s += `＋ーーーーーーーーー＋\n`;
		for (let rank = 1; rank <= 9; rank++) {
			s += `｜`;
			for (let file = 9; file > 0; file--) {
				const square = this.getTop(`${rank}-${file}`);
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
			s += `｜${String.fromCharCode(rank - 1 + '１'.charCodeAt(0))}\n`;
		}
		s += `＋ーーーーーーーーー＋\n`;
		return s;
	}

	board() {
		return this.#board;
	}

	captured(color?: Color) {
		const allCaptured = this.#history.flatMap((move) => move.captured ?? []);
		return color ? allCaptured.filter((p) => p.color === color) : allCaptured;
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

	history(opts?: { verbose?: boolean }) {
		return opts?.verbose
			? this.#history
			: this.#history.map((move) => move.san);
	}

	inDraft() {
		return this.#drafting.b || this.#drafting.w;
	}

	isGameOver() {
		return !this.inDraft() && isGameOver(this.#board);
	}

	load(fen: string) {
		this.#initializeState(parseFEN(fen));
	}

	move(
		move:
			| string
			| Pick<Move, 'from' | 'to' | 'type' | 'captured' | 'draftFinished'>
	) {
		const moves = this.moves({ verbose: true }) as Move[];
		const found =
			typeof move === 'string'
				? moves.find((m) => m.san === move)
				: moves.find(
						(m) =>
							move.type === m.type &&
							move.from === m.from &&
							move.to === m.to &&
							move.captured === m.captured &&
							move.draftFinished === m.draftFinished
					);
		if (!found) return;

		this.#history.push(found);
		this.#initializeState(parseFEN(found.after));
	}

	moves(opts?: { square?: string; arata?: HandPiece; verbose?: boolean }) {
		if (opts?.square) {
			const moves = generateMovesForSquare(opts.square, this.fen());
			return opts.verbose ? moves : moves.map((move) => move.san);
		} else if (opts?.arata) {
			const moves = generateArata(opts.arata, this.fen());
			return opts.verbose ? moves : moves.map((move) => move.san);
		} else if (this.inDraft()) {
			const moves = this.hand().flatMap((hp) => generateArata(hp, this.fen()));
			return opts?.verbose ? moves : moves.map((move) => move.san);
		} else {
			const allSquares = Array.from({ length: 9 }, (_, x) => x + 1).flatMap(
				(x) => Array.from({ length: 9 }, (_, y) => `${x}-${y + 1}`)
			);

			const boardMoves = allSquares.flatMap((square) =>
				generateMovesForSquare(square, this.fen())
			);

			const handMoves = this.hand().flatMap((hp) =>
				generateArata(hp, this.fen())
			);

			const moves = [...boardMoves, ...handMoves];
			return opts?.verbose ? moves : moves.map((move) => move.san);
		}
	}

	moveNumber() {
		return this.#moveNumber;
	}

	print(opts?: { english?: boolean }) {
		console.log(this.ascii(opts));
	}

	reset() {
		this.#initializeState(parseFEN(this.#initPosition));
	}

	turn() {
		return this.#turn;
	}

	undo() {
		const lastMove = this.#history.pop();
		if (lastMove) {
			this.#initializeState(parseFEN(lastMove.before));
		}
	}

	validateFen(fen: string) {
		return validateFen(fen);
	}
}
