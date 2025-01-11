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
};
export type HandPiece = {
	type: PieceType;
	color: Color;
	count: number;
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

export const canonicalNames: Record<PieceType, string> = {
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
	return tower ? tower.at(-1)! : null;
}

export function get(square: string, board: (Piece | null)[][][]) {
	const [rank, file] = square.split('-').map(Number);
	if (rank < 1 || rank > 9 || file < 1 || file > 9) return null;

	const s = board[rank - 1][9 - file];
	if (!s[0]) return null;

	return s as Piece[];
}

export function isGameOver(board: (Piece | null)[][][]) {
	const marshal = board
		.flat()
		.flat()
		.filter((p) => p?.type === '帥');
	return marshal.length !== 2;
}
