const inverseMap = <T extends Record<string, string | number | symbol>>(
	map: T
): Record<T[keyof T], keyof T> =>
	Object.entries(map).reduce(
		(acc, [key, value]) => ({ ...acc, [value]: key }),
		{} as Record<T[keyof T], keyof T>
	);

export type Board = (Piece | null)[][][];
export type Piece = {
	square: string;
	tier: number;
	type: PieceType;
	color: Color;
	id?: string;
};
export type HandPiece = {
	type: PieceType;
	color: Color;
	count: number;
	id?: string;
};

export type Move = {
	color: Color;
	piece: PieceType;
	from?: string;
	to: string;
	san: string;
	before: string;
	after: string;
	type: 'route' | 'capture' | 'tsuke' | 'betray' | 'arata';
	draftFinished?: boolean;
	captured?: Piece[];
};

export type SetupMode = 'intro' | 'beginner' | 'intermediate' | 'advanced';
export const setupModeToCode: Record<SetupMode, number> = {
	intro: 0,
	beginner: 1,
	intermediate: 2,
	advanced: 3,
};
export const setupCodeToMode = inverseMap(setupModeToCode);

export const WHITE = 'w';
export const BLACK = 'b';

export const TSUKE = '付';
export const TAKE = '取';
export const BETRAY = '返';
export const ARATA = '新';

export const MARSHAL = '帥';
export const GENERAL = '大';
export const LIEUTENANT_GENERAL = '中';
export const MAJOR_GENERAL = '小';
export const WARRIOR = '侍';
export const LANCER = '槍';
export const RIDER = '馬';
export const SPY = '忍';
export const FORTRESS = '砦';
export const SOLDIER = '兵';
export const CANNON = '砲';
export const ARCHER = '弓';
export const MUSKETEER = '筒';
export const TACTICIAN = '謀';

export const SQUARES = Array.from({ length: 9 }, (_, x) => x + 1).flatMap((x) =>
	Array.from({ length: 9 }, (_, y) => `${x}-${9 - y}`)
);

export type Color = 'b' | 'w';
export type PieceType =
	| '帥'
	| '大'
	| '中'
	| '小'
	| '侍'
	| '槍'
	| '馬'
	| '忍'
	| '砦'
	| '兵'
	| '砲'
	| '弓'
	| '筒'
	| '謀';

export type PieceCode =
	| 'm'
	| 'g'
	| 'i'
	| 'j'
	| 'w'
	| 'n'
	| 'r'
	| 's'
	| 'f'
	| 'd'
	| 'c'
	| 'a'
	| 'k'
	| 't';

export type Name =
	| 'marshal'
	| 'general'
	| 'lieutenant_general'
	| 'major_general'
	| 'warrior'
	| 'lancer'
	| 'rider'
	| 'spy'
	| 'fortress'
	| 'soldier'
	| 'cannon'
	| 'archer'
	| 'musketeer'
	| 'tactician';

export const piece: Record<Name, PieceType> = {
	marshal: '帥',
	general: '大',
	lieutenant_general: '中',
	major_general: '小',
	warrior: '侍',
	lancer: '槍',
	rider: '馬',
	spy: '忍',
	fortress: '砦',
	soldier: '兵',
	cannon: '砲',
	archer: '弓',
	musketeer: '筒',
	tactician: '謀',
};

export const symbolToName = inverseMap(piece);

export const pieceToFenCode: Record<Name, PieceCode> = {
	marshal: 'm',
	general: 'g',
	lieutenant_general: 'i',
	major_general: 'j',
	warrior: 'w',
	lancer: 'n',
	rider: 'r',
	spy: 's',
	fortress: 'f',
	soldier: 'd',
	cannon: 'c',
	archer: 'a',
	musketeer: 'k',
	tactician: 't',
};

export const fenCodeToPiece = inverseMap(pieceToFenCode);

export const createPieceFromFenCode = (
	code: PieceCode | Uppercase<PieceCode>,
	[y, x, z]: [number, number, number]
): Piece => {
	const color = code === code.toLowerCase() ? 'b' : 'w';
	const name = fenCodeToPiece[code.toLowerCase() as PieceCode];

	return {
		square: `${y}-${x}`,
		tier: z,
		type: piece[name],
		color,
	};
};

export const createHandPieceFromFenCode = (
	code: PieceCode | Uppercase<PieceCode>,
	count: number
): HandPiece => {
	const color = code === code.toLowerCase() ? 'b' : 'w';
	const name = fenCodeToPiece[code.toLowerCase() as PieceCode];

	return {
		type: piece[name],
		count,
		color,
	};
};

export const CANONICAL_NAMES: Record<PieceType, string> = {
	帥: 'sui',
	大: 'taishou',
	中: 'chuujou',
	小: 'shoushou',
	侍: 'samurai',
	槍: 'yari',
	馬: 'kiba',
	忍: 'shinobi',
	砦: 'toride',
	兵: 'hyou',
	砲: 'oodzutsu',
	弓: 'yumi',
	筒: 'tsutsu',
	謀: 'boushou',
};

export const ENGLISH_NAMES: Record<PieceType, string> = {
	帥: 'marshal',
	大: 'general',
	中: 'lieutenant general',
	小: 'major general',
	侍: 'warrior',
	槍: 'lancer',
	馬: 'rider',
	忍: 'spy',
	砦: 'fortress',
	兵: 'soldier',
	砲: 'cannon',
	弓: 'archer',
	筒: 'musketeer',
	謀: 'tactician',
};

export const FEN_CODES: Record<PieceType, string> = {
	帥: 'm',
	大: 'g',
	中: 'i',
	小: 'j',
	侍: 'w',
	槍: 'n',
	馬: 'r',
	忍: 's',
	砦: 'f',
	兵: 'd',
	砲: 'c',
	弓: 'a',
	筒: 'k',
	謀: 't',
};

export function updateHand(
	pieces: Piece[],
	hand: HandPiece[],
	oppositeColor = false
): HandPiece[] {
	pieces.forEach((p) => {
		const c = oppositeColor ? (p.color === 'b' ? 'w' : 'b') : p.color;
		const hp = hand.find((h) => h.type === p.type && h.color === c);
		const hpi = hand.findIndex((h) => h.type === p.type && h.color === c);

		if (hp) {
			hp.count--;
			if (hp.count === 0) hand.splice(hpi, 1);
		}
	});

	return hand;
}

export function convert(
	square: string,
	pieces: Piece[],
	board: (Piece | null)[][][]
) {
	const [rank, file] = square.split('-').map(Number);
	const tower = get(square, board);
	if (!tower) return;

	board[rank - 1][9 - file] = tower.map((piece) => {
		const p = pieces.find((p) => JSON.stringify(p) === JSON.stringify(piece));
		if (p) {
			piece.color = piece.color === 'b' ? 'w' : 'b';
		}
		return piece;
	});
}

export function remove(
	square: string,
	pieces: Piece[],
	board: (Piece | null)[][][]
) {
	const [rank, file] = square.split('-').map(Number);
	const tower = get(square, board);
	if (!tower) return;

	const newTower = tower.filter(
		(piece) => !pieces.some((p) => JSON.stringify(p) === JSON.stringify(piece))
	);

	if (newTower.length === 0) board[rank - 1][9 - file] = [null];
	else board[rank - 1][9 - file] = newTower;
}

export function removeTop(square: string, board: (Piece | null)[][][]) {
	const [rank, file] = square.split('-').map(Number);
	const tower = get(square, board);
	if (!tower) return;

	tower.pop();
	if (tower.length === 0) board[rank - 1][9 - file] = [null];
}

export function put(piece: Piece, board: (Piece | null)[][][]) {
	const [rank, file] = piece.square.split('-').map(Number);
	const occupied = board[rank - 1][9 - file];

	if (!occupied[0]) board[rank - 1][9 - file] = [piece];
	else board[rank - 1][9 - file].push(piece);
}

export function getTop(square: string, board: (Piece | null)[][][]) {
	const tower = get(square, board);
	return tower ? tower.at(-1)! : undefined;
}

export function get(square: string, board: (Piece | null)[][][]) {
	const [rank, file] = square.split('-').map(Number);
	if (rank < 1 || rank > 9 || file < 1 || file > 9) return undefined;

	const s = board[rank - 1][9 - file];
	if (!s[0]) return undefined;

	return s as Piece[];
}

export function isGameOver(board: (Piece | null)[][][]) {
	const marshal = board
		.flat()
		.flat()
		.filter((p) => p?.type === '帥');
	return marshal.length !== 2;
}
