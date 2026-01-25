import pc from 'picocolors';
import {
	ADVANCED_POSITION,
	BEGINNER_POSITION,
	encodeFEN,
	INTERMEDIATE_POSITION,
	INTRO_POSITION,
	ParsedFEN,
	validateFen,
} from './fen';
import {
	inCheck as checkDetection,
	generateArata,
	generateMovesForSquare,
	isSquareAttacked,
	wouldBeInCheckAfterMove,
} from './move_gen';
import { encodePGN, parsePGN, PGNOptions } from './pgn';
import { assignPieceIdsWithState } from './piece-ids';
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
	piece,
	Piece,
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
	isSquareAttacked,
};

export class Gungi {
	#board!: Board;
	#hand!: HandPiece[];
	#turn!: Color;
	#moveNumber!: number;
	#drafting!: Record<Color, boolean>;
	#mode!: SetupMode;

	#history: Move[] = [];
	#previousState: ParsedFEN | null = null;
	#comments: Map<string, string> = new Map();

	#initPosition: string;

	#initializeState(fen: string, move?: Move | null) {
		// Assign IDs using the previous state and move info for stability
		const stateWithIds = assignPieceIdsWithState(
			fen,
			this.#previousState,
			move
		);

		this.#board = stateWithIds.board;
		this.#hand = stateWithIds.hand;
		this.#turn = stateWithIds.turn;
		this.#moveNumber = stateWithIds.moveNumber;
		this.#drafting = stateWithIds.drafting;
		this.#mode = stateWithIds.mode;

		// Update the previous state for next time
		this.#previousState = stateWithIds;
	}

	constructor(fen?: string) {
		this.#initPosition = fen ?? INTRO_POSITION;
		this.#initializeState(this.#initPosition);
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
		this.#initializeState(ADVANCED_POSITION);
		this.#history = [];
		this.#comments.clear();
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

	#hasNoLegalMoves(): boolean {
		const fen = this.fen();
		if (this.inDraft()) {
			return this.#hand.every((hp) => generateArata(hp, fen).length === 0);
		}

		for (const sq of SQUARES) {
			if (generateMovesForSquare(sq, fen).length > 0) return false;
		}
		for (const hp of this.#hand) {
			if (generateArata(hp, fen).length > 0) return false;
		}
		return true;
	}

	#hasEscapingMove(): boolean {
		const fen = this.fen();

		// Check board moves
		for (const sq of SQUARES) {
			const moves = generateMovesForSquare(sq, fen);
			for (const move of moves) {
				if (!wouldBeInCheckAfterMove(move)) return true; // Found escaping move
			}
		}

		// Check hand moves (arata)
		for (const hp of this.#hand) {
			const moves = generateArata(hp, fen);
			for (const move of moves) {
				if (!wouldBeInCheckAfterMove(move)) return true; // Found escaping move
			}
		}

		return false; // No escaping move found
	}

	inCheck(color?: Color): boolean {
		const c = color ?? this.turn();
		return checkDetection(c, this.fen());
	}

	isCheckmate(): boolean {
		if (this.inDraft()) return false;
		if (isGameOver(this.#board)) return false; // marshal captured, not checkmate
		return this.inCheck() && !this.#hasEscapingMove();
	}

	isStalemate(): boolean {
		if (this.inDraft()) return false;
		if (isGameOver(this.#board)) return false;
		return !this.inCheck() && !this.#hasEscapingMove();
	}

	isInsufficientMaterial(): boolean {
		if (this.inDraft()) return false;

		if (this.#hand.some((p) => p.type !== piece.marshal)) return false;

		const pieces = this.#board
			.flat()
			.flat()
			.filter((p) => p !== null) as Piece[];
		const nonMarshals = pieces.filter((p) => p.type !== piece.marshal);
		if (nonMarshals.length > 0) return false;

		const marshals = pieces.filter((p) => p.type === piece.marshal);
		if (marshals.length !== 2) return false;

		const [m1, m2] = marshals;
		const [r1, f1] = m1.square.split('-').map(Number);
		const [r2, f2] = m2.square.split('-').map(Number);

		const rankDiff = Math.abs(r1 - r2);
		const fileDiff = Math.abs(f1 - f2);

		const isAdjacent = rankDiff <= 1 && fileDiff <= 1;

		return !isAdjacent;
	}

	isDraw(): boolean {
		return (
			this.isStalemate() ||
			this.isFourfoldRepetition() ||
			this.isInsufficientMaterial()
		);
	}

	isGameOver() {
		if (this.inDraft()) return false;
		if (isGameOver(this.#board)) return true; // marshal captured
		if (this.isFourfoldRepetition()) return true;
		return this.#hasNoLegalMoves(); // checkmate or stalemate
	}

	load(fen: string) {
		this.#initializeState(fen);
	}

	loadPgn(
		pgn: string,
		fen = ADVANCED_POSITION,
		opts?: Pick<PGNOptions, 'newline'>
	) {
		this.#initializeState(fen);
		this.#history = [];
		this.#comments.clear();

		const parsed = parsePGN(pgn, opts);
		parsed.moves.forEach((move, i) => {
			this.move(move);
			const comment = parsed.comments.get(i);
			if (comment) {
				this.setComment(comment);
			}
		});
	}

	move(move: string | Exclude<Move, 'color' | 'san' | 'before' | 'after'>) {
		const moves = this.moves({ verbose: true }) as Move[];
		const normalizedInput =
			typeof move === 'string' ? move.replace(/[=#]$/, '') : null;
		const found =
			typeof move === 'string'
				? moves.find((m) => m.san === normalizedInput || m.san === move)
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
		this.#initializeState(found.after, found);

		// Append game state symbols to SAN
		if (this.isCheckmate()) {
			this.#history.at(-1)!.san += '#';
		} else if (this.isStalemate() || this.isFourfoldRepetition()) {
			this.#history.at(-1)!.san += '=';
		}

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
		return encodePGN(this.#history, { ...opts, comments: this.#comments });
	}

	print(opts?: { english?: boolean }) {
		console.log(this.ascii(opts));
	}

	reset() {
		this.#initializeState(this.#initPosition);
		this.#history = [];
		this.#comments.clear();
	}

	turn() {
		return this.#turn;
	}

	undo() {
		const lastMove = this.#history.pop();
		if (lastMove) {
			this.#initializeState(lastMove.before);
			return lastMove;
		}

		return null;
	}

	setComment(comment: string) {
		this.#comments.set(this.fen(), comment);
	}

	getComment() {
		return this.#comments.get(this.fen());
	}

	removeComment() {
		const fen = this.fen();
		const comment = this.#comments.get(fen);
		this.#comments.delete(fen);
		return comment;
	}

	getComments() {
		const result: { fen: string; comment: string }[] = [];
		for (const [fen, comment] of this.#comments) {
			result.push({ fen, comment });
		}
		return result;
	}

	removeComments() {
		const comments = this.getComments();
		this.#comments.clear();
		return comments;
	}

	validateFen(fen: string) {
		return validateFen(fen);
	}
}
