import { stockpile_move_gen } from './utils/stockpile_move_gen';
import {
	get,
	get_top,
	init_stockpile,
	put,
	remove,
	remove_stockpile,
} from './utils/helper';
import {
	Piece,
	StockPiece,
	Square,
	RelaxMove,
	IsPiece,
	Move,
	MoveHistory,
} from './interfaces/igungi';
import {
	BLACK,
	WHITE,
	DRAFT,
	GAME,
	MOVEMENT,
	ATTACK,
	STACK,
	PLACE,
	READY,
	MAJOR_GENERAL,
	LIEUTENANT_GENERAL,
	GENERAL,
	ARCHER,
	KNIGHT,
	MUSKETEER,
	CAPTAIN,
	SAMURAI,
	FORTRESS,
	CANNON,
	SPY,
	PAWN,
	MARSHAL,
	RANK_9,
	FILE_9,
	TIER1_BLACK,
	TIER1_WHITE,
	TIER2_BLACK,
	TIER2_WHITE,
	TIER3_BLACK,
	TIER3_WHITE,
	FILE_1,
	RANK_1,
} from './utils/constants';
import {
	generate_moves_from_probes,
	isSquareOutOfBounds,
	single_sqaure_move_gen,
} from './utils/move_gen';

class Gungi {
	readonly BLACK: 'b';
	readonly WHITE: 'w';

	readonly DRAFT: 'draft';
	readonly GAME: 'game';

	readonly ATTACK: 'attack';
	readonly MOVEMENT: 'move';
	readonly STACK: 'stack';
	readonly PLACE: 'place';
	readonly READY: 'ready';

	readonly MAJOR_GENERAL: '小';
	readonly LIEUTENANT_GENERAL: '中';
	readonly GENERAL: '大';
	readonly ARCHER: '弓';
	readonly KNIGHT = '馬';
	readonly MUSKETEER: '筒';
	readonly CAPTAIN: '謀';
	readonly SAMURAI: '侍';
	readonly FORTRESS: '砦';
	readonly CANNON: '砲';
	readonly SPY: '忍';
	readonly PAWN: '兵';
	readonly MARSHAL: '帥';

	board: Array<Array<Array<Piece | null>>>;
	turn: 'b' | 'w';
	phase: 'game' | 'draft';
	stockpile: StockPiece[];

	private _drafted: { w: number; b: number };
	private _marshal_placed: { w: number; b: number };
	private _army_size: { w: number; b: number };
	private _history: MoveHistory[];
	private _captured: StockPiece[];
	private _turn_count: number;

	ascii: () => string;
	get: (square: Square) => (Piece | null)[];
	get_top: (square: Square) => { piece: Piece | null; tier: number } | null;
	get_board: () => (Piece | null)[][][];
	get_stockpile: (color?: 'b' | 'w') => StockPiece[];
	get_army_size: (color: 'b' | 'w') => number;
	moves: (options?: { square?: Square | undefined } | undefined) => RelaxMove[];
	move: (player_move: Move) => RelaxMove | null;
	in_check: () => boolean;
	in_checkmate: () => boolean;
	in_stalemate: () => boolean;
	game_over: () => boolean;
	get_captured: (color?: 'b' | 'w') => StockPiece[];

	constructor() {
		this.BLACK = BLACK;
		this.WHITE = WHITE;

		this.DRAFT = DRAFT;
		this.GAME = GAME;
		this.ATTACK = ATTACK;
		this.MOVEMENT = MOVEMENT;
		this.STACK = STACK;
		this.PLACE = PLACE;
		this.READY = READY;

		this.MAJOR_GENERAL = MAJOR_GENERAL;
		this.LIEUTENANT_GENERAL = LIEUTENANT_GENERAL;
		this.GENERAL = GENERAL;
		this.ARCHER = ARCHER;
		this.KNIGHT = KNIGHT;
		this.MUSKETEER = MUSKETEER;
		this.CAPTAIN = CAPTAIN;
		this.SAMURAI = SAMURAI;
		this.FORTRESS = FORTRESS;
		this.CANNON = CANNON;
		this.SPY = SPY;
		this.PAWN = PAWN;
		this.MARSHAL = MARSHAL;

		this.board = [];
		for (let i: number = 0; i < RANK_9; i++) {
			this.board[i] = [];
			for (let k: number = 0; k < FILE_9; k++) {
				this.board[i][k] = [null, null, null];
			}
		}

		this.turn = BLACK;
		this.phase = DRAFT;
		this.stockpile = [];
		this._history = [];
		this._captured = [];
		this._drafted = {
			w: 0,
			b: 0,
		};
		this._marshal_placed = {
			w: 0,
			b: 0,
		};
		this._army_size = {
			w: 0,
			b: 0,
		};
		this._turn_count = 0;

		Array.prototype.push.apply(this.stockpile, init_stockpile(WHITE));
		Array.prototype.push.apply(this.stockpile, init_stockpile(BLACK));

		this.get_board = () => {
			return [...this.board];
		};

		this.get_stockpile = (color?: 'w' | 'b') => {
			if (!color) {
				return [...this.stockpile];
			}

			return [...this.stockpile.filter((x) => x.piece.color === color)];
		};

		this.get_army_size = (color: 'w' | 'b') => {
			if (color === 'w') {
				return this._army_size.w;
			} else {
				return this._army_size.b;
			}
		};

		this.get_captured = (color?: 'w' | 'b') => {
			if (!color) {
				return [...this._captured];
			}

			return [...this._captured.filter((x) => x.piece.color == color)];
		};

		this.get = (square: Square) => {
			return get(this.board, square);
		};

		this.get_top = (square: Square) => {
			return get_top(this.board, square);
		};

		this.in_check = () => {
			var is_in_check = false;
			var vision: { rank: number; file: number }[] = [];

			for (var i = RANK_1; i <= RANK_9; i++) {
				for (var j = FILE_1; j <= FILE_9; j++) {
					var square = i + '-' + j;
					var src = get_top(this.board, square);
					if (src && src.piece?.color !== this.turn) {
						var probes = single_sqaure_move_gen(this.board, src, square);
						vision = vision.concat(probes);
					}
				}
			}

			vision.forEach((square) => {
				var top = get_top(this.board, square.rank + '-' + square.file);
				if (
					top !== null &&
					top.piece?.type === MARSHAL &&
					top.piece?.color == this.turn
				) {
					is_in_check = true;
				}
			});

			return is_in_check;
		};

		this.in_checkmate = () => {
			return this.in_check() && this.moves().length == 0;
		};

		this.in_stalemate = () => {
			return !this.in_check() && this.moves().length == 0;
		};

		this.game_over = () => {
			return this.in_checkmate() || this.in_stalemate();
		};

		this.moves = (options?: { square?: Square }) => {
			let moves: RelaxMove[] = [];

			if (this.phase === GAME) {
				for (var i = RANK_1; i <= RANK_9; i++) {
					for (var j = FILE_1; j <= FILE_9; j++) {
						var square = i + '-' + j;
						var src = get_top(this.board, square);
						if (src != null && src.piece?.color === this.turn) {
							var probes = single_sqaure_move_gen(this.board, src, square);
							moves = moves.concat(
								generate_moves_from_probes(
									this.board,
									probes,
									src,
									square,
									this.turn
								)
							);
						}
					}
				}
			}

			moves = moves.concat(
				stockpile_move_gen(
					this.board,
					this.phase,
					this.turn,
					this.stockpile,
					this._marshal_placed,
					this._army_size
				)
			);

			var temp_board = JSON.stringify(this.board);
			for (var i = moves.length - 1; i >= 0; i--) {
				var move = moves[i];

				switch (move.type) {
					case MOVEMENT:
						if (move.dst && typeof move.src === 'string') {
							var piece = remove(this.board, move.src);
							put(this.board, piece, move.dst);
						}
						break;
					case PLACE:
						if (move.src && move.dst && IsPiece(move.src)) {
							put(
								this.board,
								{
									type: move.src.type,
									color: move.src.color,
								},
								move.dst
							);
						}
						break;
					case ATTACK:
						if (move.dst) {
							var piece = remove(this.board, move.dst);

							if (get_top(this.board, move.dst) === null) {
								if (move.src && typeof move.src === 'string') {
									var temp = remove(this.board, move.src);
									put(this.board, temp, move.dst);
								}
							}
						}
						break;
					case STACK:
						if (move.src && move.dst && typeof move.src === 'string') {
							var piece = remove(this.board, move.src);
							put(this.board, piece, move.dst);
						}
						break;
					default:
						break;
				}

				// pawns can't place opponent into mate
				// if (move.src !== null && IsPiece(move.src) && move.src.type === PAWN) {
				// 	if (this.turn === BLACK) {
				// 		this.turn = WHITE;
				// 	} else {
				// 		this.turn = BLACK;
				// 	}

				// 	// if (this.in_checkmate()) {
				// 	// 	moves.splice(i, 1);
				// 	// }

				// 	if (this.turn === BLACK) {
				// 		this.turn = WHITE;
				// 	} else {
				// 		this.turn = BLACK;
				// 	}
				// }

				if (this.in_check()) {
					moves.splice(i, 1);
				}

				this.board = JSON.parse(temp_board);
			}

			if (options && options.square != null) {
				var input = options.square.split('-');
				var rank = parseInt(input[0]);
				var file = parseInt(input[1]);

				if (!isSquareOutOfBounds(rank, file)) {
					return moves.filter(
						(x) =>
							x.src !== null &&
							x.src === options.square &&
							x.type !== PLACE &&
							x.type !== READY
					);
				}
			}

			return moves;
		};

		this.move = (player_move: Move) => {
			var legal_moves = this.moves().filter(
				(x) => JSON.stringify(x) === JSON.stringify(player_move)
			);
			if (legal_moves.length) {
				var legal_move = legal_moves[0];
				var destination_piece = null;

				if (typeof legal_move.dst === 'string') {
					destination_piece = get_top(this.board, legal_move.dst);
					if (destination_piece == null) {
						destination_piece = { piece: null, tier: 1 };
					}
				}

				switch (legal_move.type) {
					case MOVEMENT:
						if (
							legal_move &&
							legal_move.dst &&
							typeof legal_move.src === 'string'
						) {
							var piece = remove(this.board, legal_move.src);
							put(this.board, piece, legal_move.dst);
						}
						break;
					case PLACE:
						if (legal_move && legal_move.dst && IsPiece(legal_move.src)) {
							remove_stockpile(this.stockpile, legal_move.src);

							put(
								this.board,
								{
									type: legal_move.src.type,
									color: legal_move.src.color,
								},
								legal_move.dst
							);

							if (legal_move.src.color === BLACK) {
								this._army_size.b++;
								if (legal_move.src.type === MARSHAL) {
									this._marshal_placed.b = 1;
								}
							} else {
								this._army_size.w++;
								if (legal_move.src.type === MARSHAL) {
									this._marshal_placed.w = 1;
								}
							}
						}

						break;
					case ATTACK:
						if (legal_move.dst) {
							var piece = remove(this.board, legal_move.dst);

							if (piece) {
								var c = this._captured.filter(
									(x) => JSON.stringify(x.piece) === JSON.stringify(piece)
								);
								if (c.length > 0) {
									c[0].amount++;
								} else {
									this._captured.push({ piece, amount: 1 });
								}
							}

							if (get_top(this.board, legal_move.dst) === null) {
								if (legal_move && typeof legal_move.src === 'string') {
									var temp = remove(this.board, legal_move.src);
									put(this.board, temp, legal_move.dst);
								}
							}
						}
						break;
					case STACK:
						if (
							legal_move &&
							legal_move.dst &&
							typeof legal_move.src === 'string'
						) {
							var piece = remove(this.board, legal_move.src);
							put(this.board, piece, legal_move.dst);
						}
						break;
					case READY:
						if (this.turn === BLACK) {
							this._drafted.b = 1;
						} else {
							this._drafted.w = 1;
						}

						break;
				}

				var source_piece =
					typeof legal_move.src === 'string'
						? get_top(this.board, legal_move.src)
						: null;
				var destination_piece = null;

				if (typeof legal_move.dst === 'string') {
					destination_piece = get_top(this.board, legal_move.dst);
					if (destination_piece == null) {
						destination_piece = { piece: null, tier: 1 };
					}
				}

				this._turn_count++;
				this._history.push({
					turn: this._turn_count,
					src: legal_move.src,
					dst: legal_move.dst,
					type: legal_move.type,
					srcTier: source_piece?.tier,
					dstTier: destination_piece?.tier,
				});

				if (this.phase === DRAFT) {
					if (this._drafted.w === 0 && this._drafted.b === 0) {
						if (this.turn === BLACK) {
							this.turn = WHITE;
						} else {
							this.turn = BLACK;
						}
					} else if (this._drafted.w === 1 && this._drafted.b === 0) {
						this.turn = BLACK;
					} else if (this._drafted.w === 0 && this._drafted.b === 1) {
						this.turn = WHITE;
					} else if (this._drafted.w === 1 && this._drafted.b === 1) {
						this.turn = WHITE;
						this.phase = GAME;
					}
				} else {
					// Game phase
					if (this.turn === BLACK) {
						this.turn = WHITE;
					} else {
						this.turn = BLACK;
					}
				}

				return legal_move;
			}
			return null;
		};

		this.ascii = () => {
			var s =
				'     +--------------------------------------------------------+\n';
			s += '     |                                                        |\n';
			for (let i = 9; i > 0; i--) {
				s += ` ｒ${i} |  `;

				for (let j = 1; j < 10; j++) {
					let top = get_top(this.board, i + '-' + j);
					if (top !== null) {
						let type = top.piece?.type;
						let color = top.piece?.color;
						let symbol = '';

						switch (top.tier) {
							case 1:
								symbol = color === WHITE ? TIER1_WHITE : TIER1_BLACK;
								break;
							case 2:
								symbol = color === WHITE ? TIER2_WHITE : TIER2_BLACK;
								break;
							case 3:
								symbol = color === WHITE ? TIER3_WHITE : TIER3_BLACK;
								break;
						}

						s += `${symbol + type}  `;
					} else {
						s += '。。  ';
					}
				}
				s += '|\n';
				s +=
					'     |                                                        |\n';
			}
			s += '     +--------------------------------------------------------+\n';
			s += '        ｆ１  ｆ２  ｆ３  ｆ４  ｆ５  ｆ６  ｆ７  ｆ８  ｆ９';
			return s;
		};
	}
}

export { Gungi };
