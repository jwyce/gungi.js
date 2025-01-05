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

export type SetupMode = 'intro' | 'beginner' | 'intermediate' | 'advanced';
export const setupModeToCode: Record<SetupMode, number> = {
	intro: 0,
	beginner: 1,
	intermediate: 2,
	advanced: 3,
};
export const setupCodeToMode = inverseMap(setupModeToCode);
export const nonDraftModes = ['intro', 'beginner'] as SetupMode[];

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
