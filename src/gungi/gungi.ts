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
	Piece,
	PieceIdRegistry,
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
	#idRegistry: PieceIdRegistry;

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

		// Assign IDs to pieces that don't have them and sync registry
		this.#assignMissingIds();
		this.#syncRegistryWithState();
	}

	#assignMissingIds() {
		// Assign IDs to board pieces without them
		for (let rank = 0; rank < 9; rank++) {
			for (let file = 0; file < 9; file++) {
				const tower = this.#board[rank][file];
				if (tower && tower[0]) {
					for (let tierIdx = 0; tierIdx < tower.length; tierIdx++) {
						const piece = tower[tierIdx];
						if (piece && !piece.id) {
							piece.id = this.#idRegistry.createPieceWithId(
								piece.type,
								piece.color,
								piece.square,
								piece.tier
							).id;
						}
					}
				}
			}
		}

		// Assign IDs to hand pieces without them
		for (const handPiece of this.#hand) {
			if (!handPiece.ids || handPiece.ids.length === 0) {
				handPiece.ids = [];
				for (let i = 0; i < handPiece.count; i++) {
					const newId = this.#idRegistry.createPieceWithId(
						handPiece.type,
						handPiece.color,
						'hand',
						0
					).id!;
					handPiece.ids.push(newId);
					// Remove from board registry since it's in hand
					this.#idRegistry.removePieceId('hand', 0);
					// Add to hand registry
					this.#idRegistry.addToHand(handPiece.type, handPiece.color, [newId]);
				}
			} else {
				// Ensure hand registry is synced
				const existingIds = this.#idRegistry.getHandIds(
					handPiece.type,
					handPiece.color
				);
				if (existingIds.length !== handPiece.count) {
					// Clear and rebuild hand registry for this piece type/color
					const key = `${handPiece.type}-${handPiece.color}`;
					this.#idRegistry.addToHand(
						handPiece.type,
						handPiece.color,
						handPiece.ids.slice()
					);
				}
			}
		}
	}

	#syncRegistryWithState() {
		this.#idRegistry.syncWithBoard(this.#board, this.#hand);
	}

	constructor(fen?: string) {
		this.#initPosition = fen ?? INTRO_POSITION;
		this.#idRegistry = new PieceIdRegistry();
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

		// Capture ID information before move execution
		const idSnapshot = this.#captureIdSnapshot(found);

		this.#history.push(found);
		if (this.isFourfoldRepetition()) this.#history.at(-1)!.san += '停';

		// Initialize new state from FEN (this loses IDs)
		this.#initializeState(parseFEN(found.after));

		// Restore ID mappings accounting for the move
		this.#restoreIdMappings(found, idSnapshot);

		return found;
	}

	#captureIdSnapshot(move: Move) {
		const snapshot = {
			boardPieces: new Map<string, string>(), // square-tier -> ID
			handPieces: new Map<string, string[]>(), // type-color -> IDs
			movingPieceId: null as string | null,
			capturedIds: [] as string[],
			handPieceId: null as string | null, // for arata moves
		};

		// Capture all board pieces
		for (let rank = 0; rank < 9; rank++) {
			for (let file = 0; file < 9; file++) {
				const tower = this.#board[rank][file];
				if (tower && tower[0]) {
					for (const piece of tower) {
						if (piece && piece.id) {
							snapshot.boardPieces.set(
								`${piece.square}-${piece.tier}`,
								piece.id
							);
						}
					}
				}
			}
		}

		// Capture hand pieces
		for (const handPiece of this.#hand) {
			if (handPiece.ids && handPiece.ids.length > 0) {
				snapshot.handPieces.set(`${handPiece.type}-${handPiece.color}`, [
					...handPiece.ids,
				]);
			}
		}

		// Capture moving piece ID
		if (move.from) {
			const movingPiece = this.getTop(move.from);
			if (movingPiece && movingPiece.id) {
				snapshot.movingPieceId = movingPiece.id;
			}
		}

		// For arata moves, capture the hand piece ID being used
		if (move.type === 'arata') {
			const handPieces = this.#hand.find(
				(hp) => hp.type === move.piece && hp.color === move.color
			);
			if (handPieces && handPieces.ids && handPieces.ids.length > 0) {
				snapshot.handPieceId = handPieces.ids[0]; // Use first available
			}
		}

		// Capture IDs of pieces being captured
		if (move.captured) {
			snapshot.capturedIds = move.captured
				.map((p) => p.id)
				.filter((id): id is string => id !== undefined);
		}

		return snapshot;
	}

	#restoreIdMappings(move: Move, snapshot: any) {
		// Clear current registry and rebuild with ID preservation
		this.#idRegistry = new PieceIdRegistry();

		// Restore board pieces, accounting for the move
		const [toRank, toFile, toTier] = move.to.split('-').map(Number);

		for (let rank = 0; rank < 9; rank++) {
			for (let file = 0; file < 9; file++) {
				const tower = this.#board[rank][file];
				if (tower && tower[0]) {
					for (let tierIdx = 0; tierIdx < tower.length; tierIdx++) {
						const piece = tower[tierIdx];
						if (piece) {
							let pieceId: string;

							// Check if this is the destination of our move
							if (
								rank === toRank - 1 &&
								file === 9 - toFile &&
								tierIdx === toTier - 1
							) {
								// This is the piece that moved
								if (move.type === 'arata' && snapshot.handPieceId) {
									pieceId = snapshot.handPieceId;
								} else if (snapshot.movingPieceId) {
									pieceId = snapshot.movingPieceId;
								} else {
									// Generate new ID if we can't find the original
									pieceId = this.#idRegistry.createPieceWithId(
										piece.type,
										piece.color,
										piece.square,
										piece.tier
									).id!;
								}
							} else {
								// Try to find existing ID for this position
								const existingId = snapshot.boardPieces.get(
									`${piece.square}-${piece.tier}`
								);
								if (existingId) {
									pieceId = existingId;
								} else {
									// Generate new ID
									pieceId = this.#idRegistry.createPieceWithId(
										piece.type,
										piece.color,
										piece.square,
										piece.tier
									).id!;
								}
							}

							piece.id = pieceId;
							this.#idRegistry.setPieceId(piece.square, piece.tier, pieceId);
						}
					}
				}
			}
		}

		// Restore hand pieces with proper ID tracking
		for (const handPiece of this.#hand) {
			const key = `${handPiece.type}-${handPiece.color}`;
			let ids = snapshot.handPieces.get(key) || [];

			// Handle captured pieces being added to hand
			if (move.captured && move.type === 'capture') {
				const capturedOfThisType = move.captured.filter(
					(p) =>
						p.type === handPiece.type &&
						(p.color === 'w' ? 'b' : 'w') === handPiece.color
				);
				for (const captured of capturedOfThisType) {
					if (captured.id) {
						ids.push(captured.id);
					}
				}
			}

			// For arata moves, remove the used piece ID
			if (
				move.type === 'arata' &&
				move.piece === handPiece.type &&
				move.color === handPiece.color &&
				snapshot.handPieceId
			) {
				ids = ids.filter((id: string) => id !== snapshot.handPieceId);
			}

			// Ensure we have the right number of IDs
			while (ids.length < handPiece.count) {
				const newId = this.#idRegistry.createPieceWithId(
					handPiece.type,
					handPiece.color,
					'hand',
					0
				).id!;
				this.#idRegistry.removePieceId('hand', 0);
				ids.push(newId);
			}

			ids = ids.slice(0, handPiece.count);
			handPiece.ids = ids;
			this.#idRegistry.addToHand(handPiece.type, handPiece.color, ids);
		}
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

	// ID-aware methods
	getPieceId(square: string, tier?: number): string | undefined {
		if (tier !== undefined) {
			return this.#idRegistry.getPieceId(square, tier);
		}

		// Get ID of top piece if tier not specified
		const topPiece = this.getTop(square);
		if (topPiece) {
			return this.#idRegistry.getPieceId(square, topPiece.tier);
		}

		return undefined;
	}

	getPieceById(id: string): Piece | undefined {
		// Search board for piece with this ID
		for (let rank = 0; rank < 9; rank++) {
			for (let file = 0; file < 9; file++) {
				const tower = this.#board[rank][file];
				if (tower && tower[0]) {
					for (const piece of tower) {
						if (piece && piece.id === id) {
							return piece;
						}
					}
				}
			}
		}
		return undefined;
	}

	getHandPieceIds(type?: string, color?: Color): string[] {
		if (type && color) {
			return this.#idRegistry.getHandIds(type as any, color);
		}

		// Get all hand piece IDs
		const allIds: string[] = [];
		for (const handPiece of this.#hand) {
			if (handPiece.ids) {
				allIds.push(...handPiece.ids);
			}
		}
		return allIds;
	}

	getBoardWithIds(): (Piece | null)[][][] {
		// Return a copy of the board with all ID information
		return this.#board.map((rank) =>
			rank.map((tower) => tower.map((piece) => (piece ? { ...piece } : null)))
		);
	}

	getHandWithIds(color?: Color): HandPiece[] {
		// Return hand pieces with ID arrays
		const handWithIds = this.#hand.map((hp) => ({ ...hp }));
		return color
			? handWithIds.filter((piece) => piece.color === color)
			: handWithIds;
	}

	// Get a specific hand piece ID (useful for selecting which piece to play)
	getHandPieceId(
		type: string,
		color: Color,
		index: number = 0
	): string | undefined {
		const handPiece = this.#hand.find(
			(hp) => hp.type === type && hp.color === color
		);
		if (handPiece && handPiece.ids && handPiece.ids.length > index) {
			return handPiece.ids[index];
		}
		return undefined;
	}

	// Remove a specific hand piece ID (useful for implementing piece selection)
	removeHandPieceId(type: string, color: Color, id: string): boolean {
		const handPiece = this.#hand.find(
			(hp) => hp.type === type && hp.color === color
		);
		if (handPiece && handPiece.ids) {
			const index = handPiece.ids.indexOf(id);
			if (index !== -1) {
				handPiece.ids.splice(index, 1);
				handPiece.count = Math.max(0, handPiece.count - 1);
				this.#idRegistry.removeFromHand(type as any, color, 1);
				return true;
			}
		}
		return false;
	}

	// Debug method to inspect registry state
	getIdRegistryState() {
		return this.#idRegistry.getRegistryState();
	}
}
