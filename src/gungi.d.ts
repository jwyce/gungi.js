// Type definitions for gungi.js 1.0.1
// Project: https://github.com/jwyce/gungi.js

/**
 * - '小' for Major General
 * - '中' for Lieutenant General
 * - '大' for General
 * - '弓' for Archer
 * - '馬' for Knight
 * - '筒' for Musketeer
 * - '謀' for Captain
 * - '侍' for Samurai
 * - '砦' for Fortress
 * - '砲' for Cannon
 * - '忍' for Spy
 * - '兵' for Pawn
 * - '帥' for Marshall
 */
export type PieceType =
	| '小'
	| '中'
	| '大'
	| '弓'
	| '馬'
	| '筒'
	| '謀'
	| '侍'
	| '砦'
	| '砲'
	| '忍'
	| '兵'
	| '帥';

export type MoveType = 'attack' | 'move' | 'stack' | 'place' | 'ready';

export type HistoryType = {
	turn: 'b' | 'w';
	half_move_number: number;
	move: Move;
	from: Piece | null;
	to: Piece | null;
	type: MoveType;
};

export interface Piece {
	/**
	 * The type of the piece
	 */
	type: PieceType;

	/**
	 * The color of the piece
	 * - 'b' for Black
	 * - 'w' for White
	 */
	color: 'b' | 'w';
}

export interface StockPiece {
	piece: Piece;
	amount: number;
}

/**
 * The full data about a gungi move
 */
export interface Move {
	/**
	 * The source of the move
	 * - Piece if from player stockpile
	 * - string board position [e.g. "9-2"] if from square on board
	 * - null if readying
	 */
	src: Piece | string | null;

	/**
	 * The destination of the move
	 * - string board position [e.g. "9-2"] if to square on board
	 * - null if readying
	 */
	dst: string | null;

	/**
	 * The type of move to make
	 */
	type: MoveType;
}

export interface GungiInstance {
	/** The string that represents the Black color side */
	readonly BLACK: 'b';

	/** The string that represents the White color side */
	readonly WHITE: 'w';

	/** The string that represents the Draft phase */
	readonly DRAFT: 'draft';

	/** The string that represents the Game phase */
	readonly GAME: 'game';

	/** The string that represents the Attack move type */
	readonly ATTACK: 'attack';

	/** The string that represents the Movement move type */
	readonly MOVEMENT: 'move';

	/** The string that represents the Stack move type */
	readonly STACK: 'stack';

	/** The string that represents the Place move type */
	readonly PLACE: 'place';

	/** The string that represents the Ready move type */
	readonly READY: 'ready';

	/** The string that represents a Major General */
	readonly MAJOR_GENERAL: '小';

	/** The string that represents a Lieutenant General */
	readonly LIEUTENANT_GENERAL: '中';

	/** The string that represents a General */
	readonly GENERAL: '大';

	/** The string that represents an Archer */
	readonly ARCHER: '弓';

	/** The string that represents a Knight */
	readonly KNIGHT: '馬';

	/** The string that represents a Musketeer */
	readonly MUSKETEER: '筒';

	/** The string that represents a Captain */
	readonly CAPTAIN: '謀';

	/** The string that represents a Samurai */
	readonly SAMURAI: '侍';

	/** The string that represents a Fortress */
	readonly FORTRESS: '砦';

	/** The string that represents a Cannon */
	readonly CANNON: '砲';

	/** The string that represents a Spy */
	readonly SPY: '忍';

	/** The string that represents a Pawn */
	readonly PAWN: '兵';

	/** The string that represents a Marshall */
	readonly MARSHALL: '帥';

	/** The string that represents a tier 1 white piece */
	readonly TIER1_WHITE: '一';

	/** The string that represents a tier 2 white piece */
	readonly TIER2_WHITE: '二';

	/** The string that represents a tier 3 white piece */
	readonly TIER3_WHITE: '三';

	/** The string that represents a tier 1 black piece */
	readonly TIER1_BLACK: '壱';

	/** The string that represents a tier 2 black piece */
	readonly TIER2_BLACK: '弐';

	/** The string that represents a tier 3 black piece */
	readonly TIER3_BLACK: '参';

	/**
	 * Returns a string containing an ASCII diagram of the current position.
	 * @returns A string containing an ASCII diagram of the current position.
	 */
	ascii(): string;

	/**
	 * Returns the tower of pieces on the square
	 * @param square the string 2D coordinate to get the piece on [e.g. "2-5"].
	 * @returns null if no piece is on that square, or it is not a valid square.
	 * Otherwise a list of pieces object with 3 indices.
	 */
	get(square: string): Piece[] | null;

	/**
	 * Returns the top piece on the square
	 * @param square the string 2D coordinate to get the piece on [e.g. "2-5"].
	 * @returns null if no piece is on that square, or it is not a valid square.
	 * Otherwise a piece object.
	 */
	get_top(square: string): Piece | null;

	/**
	 * Returns a list of pieces from the player's current stockpiles
	 * @param color optional param to filter a specific side's stockpile.
	 * @returns a list of Pieces and quantities
	 */
	stockpile(color?: 'b' | 'w'): StockPiece[];

	board(): (Piece | null)[][][];

	history(): HistoryType[];

	pgn(): string;

	/**
	 * Returns the current side to move.
	 * @returns 'b' if Black is the side to move, otherwise 'w' for White.
	 */
	turn(): 'w' | 'b';

	/**
	 * Returns the phase of the game.
	 * @returns 'draft' if in drafting phase, otherwise 'game' after both players have readied.
	 */
	phase(): 'draft' | 'game';

	captured(color: 'w' | 'b'): Piece[];

	/**
	 * Returns true if the game has ended via checkmate or stalemate.
	 * Otherwise, returns false.
	 * @returns True if the game has ended via checkmate or stalemate.
	 * Otherwise, returns false.
	 */
	game_over(): boolean;

	/**
	 * Returns true or false if the side to move has been checkmated;
	 * @returns true or false if the side to move has been checkmated.
	 */
	in_checkmate(): boolean;

	/**
	 * Returns true or false if the side to move is in check;
	 * @returns true or false if the side to move is in check.
	 */
	in_check(): boolean;

	/**
	 * Returns true or false if the side to move has been stalemated;
	 * @returns true or false if the side to move has been stalemated.
	 */
	in_stalemate(): boolean;

	moves(options?: { square?: string; stock_piece?: PieceType }): Move[];

	move(move: Move): Move | null;
}

/**
 * The gungi.js function that is used to build the gungi game instances.
 * It can be used with or without `new` to build your instance. Both variants
 * work the same.
 */
export const Gungi: {
	(): GungiInstance;

	new (): GungiInstance;
};
