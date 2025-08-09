import pc from 'picocolors';
import {
	ADVANCED_POSITION,
	BEGINNER_POSITION,
	encodeFEN,
	INTERMEDIATE_POSITION,
	INTRO_POSITION,
	ParsedFEN,
	parseFEN,
	validateFen,
} from './fen';
import { generateArata, generateMovesForSquare } from './move_gen';
import { encodePGN, parsePGN, PGNOptions } from './pgn';
import {
	ARATA,
	ARCHER,
	BETRAY,
	BLACK,
	Board,
	CANNON,
	CANONICAL_NAMES,
	Color,
	ENGLISH_NAMES,
	FEN_CODES,
	FORTRESS,
	GENERAL,
	get,
	getTop,
	HandPiece,
	isGameOver,
	LANCER,
	LIEUTENANT_GENERAL,
	MAJOR_GENERAL,
	MARSHAL,
	Move,
	MUSKETEER,
	pieceToFenCode,
	RIDER,
	SetupMode,
	SOLDIER,
	SPY,
	SQUARES,
	symbolToName,
	TACTICIAN,
	TAKE,
	TSUKE,
	WARRIOR,
	WHITE,
} from './utils';

export {
	WHITE,
	BLACK,
	MARSHAL,
	GENERAL,
	LIEUTENANT_GENERAL,
	MAJOR_GENERAL,
	WARRIOR,
	LANCER,
	RIDER,
	SPY,
	FORTRESS,
	SOLDIER,
	CANNON,
	ARCHER,
	MUSKETEER,
	TACTICIAN,
	TSUKE,
	TAKE,
	BETRAY,
	ARATA,
	INTRO_POSITION,
	BEGINNER_POSITION,
	INTERMEDIATE_POSITION,
	ADVANCED_POSITION,
	SQUARES,
	CANONICAL_NAMES,
	ENGLISH_NAMES,
	FEN_CODES,
	validateFen,
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
		const capturedCounts = allCaptured.reduce((acc, p) => {
			const c = acc.find((a) => a.type === p.type && a.color === p.color);
			if (c) {
				c.count++;
			} else {
				acc.push({ type: p.type, color: p.color, count: 1 });
			}
			return acc;
		}, [] as HandPiece[]);

		return color
			? capturedCounts.filter((p) => p.color === color)
			: capturedCounts;
	}

	clear() {
		this.#initializeState(parseFEN(ADVANCED_POSITION));
		this.#history = [];
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

	isFourfoldRepetition() {
		const states = this.#history.map((move) => move.before.split(' ')[0]);
		if (states.length) states.push(this.#history.at(-1)!.after.split(' ')[0]);
		const frequencyMap = states.reduce((map, str) => {
			map.set(str, (map.get(str) || 0) + 1);
			return map;
		}, new Map<string, number>());

		return Math.max(...frequencyMap.values()) === 4;
	}

	isGameOver() {
		return (
			!this.inDraft() &&
			(isGameOver(this.#board) || this.isFourfoldRepetition())
		);
	}

	load(fen: string) {
		this.#initializeState(parseFEN(fen));
	}

	loadPgn(
		pgn: string,
		fen = ADVANCED_POSITION,
		opts?: Pick<PGNOptions, 'newline'>
	) {
		this.#initializeState(parseFEN(fen));
		this.#history = [];
		const moves = parsePGN(pgn, opts);
		moves.forEach((move) => this.move(move));
	}

	move(move: string | Exclude<Move, 'color' | 'san' | 'before' | 'after'>) {
		const moves = this.moves({ verbose: true }) as Move[];
		const found =
			typeof move === 'string'
				? moves.find((m) => m.san === move)
				: moves.find(
						(m) =>
							move.piece === m.piece &&
							move.type === m.type &&
							move.from === m.from &&
							move.to === m.to &&
							move.captured === m.captured &&
							move.draftFinished === m.draftFinished
					);
		if (!found) throw new Error(`Illegal move: ${move}`);

		this.#history.push(found);
		if (this.isFourfoldRepetition()) this.#history.at(-1)!.san += '停';
		this.#initializeState(parseFEN(found.after));
		return found;
	}

	moves(opts?: { square?: string; arata?: HandPiece; verbose?: boolean }) {
		if (this.isGameOver()) return [];

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
			const boardMoves = SQUARES.flatMap((square) =>
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

	pgn(opts?: PGNOptions) {
		return encodePGN(this.#history, opts);
	}

	print(opts?: { english?: boolean }) {
		console.log(this.ascii(opts));
	}

	reset() {
		this.#initializeState(parseFEN(this.#initPosition));
		this.#history = [];
	}

	turn() {
		return this.#turn;
	}

	undo() {
		const lastMove = this.#history.pop();
		if (lastMove) {
			this.#initializeState(parseFEN(lastMove.before));
			return lastMove;
		}

		return null;
	}

	validateFen(fen: string) {
		return validateFen(fen);
	}
}
