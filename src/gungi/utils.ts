export type Color = 'b' | 'w';
export type Piece =
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

export const piece: Record<Name, Piece> = {
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

export const getPieceInfo = (p: Piece) => {
	switch (p) {
		case piece.marshal:
			return { symbol: p, name: 'Marshal', canonical: 'sui', count: 1 };
		case piece.general:
			return { symbol: p, name: 'General', canonical: 'taishou', count: 1 };
		case piece.lieutenant_general:
			return {
				symbol: p,
				name: 'Lieutenant General',
				canonical: 'chuujou',
				count: 1,
			};
		case piece.major_general:
			return {
				symbol: p,
				name: 'Major General',
				canonical: 'shoushou',
				count: 2,
			};
		case piece.warrior:
			return { symbol: p, name: 'Warrior', canonical: 'samurai', count: 2 };
		case piece.lancer:
			return { symbol: p, name: 'Lancer', canonical: 'yari', count: 3 };
		case piece.rider:
			return { symbol: p, name: 'Rider', canonical: 'kiba', count: 2 };
		case piece.spy:
			return { symbol: p, name: 'Spy', canonical: 'shinobi', count: 2 };
		case piece.fortress:
			return { symbol: p, name: 'Fortress', canonical: 'toride', count: 2 };
		case piece.soldier:
			return { symbol: p, name: 'Soldier', canonical: 'hyou', count: 4 };
		case piece.cannon:
			return { symbol: p, name: 'Cannon', canonical: 'oodzutsu', count: 1 };
		case piece.archer:
			return { symbol: p, name: 'Archer', canonical: 'yumi', count: 2 };
		case piece.musketeer:
			return { symbol: p, name: 'Musketeer', canonical: 'tsutsu', count: 1 };
		case piece.tactician:
			return { symbol: p, name: 'Tactician', canonical: 'boushou', count: 1 };
		// THIS WILL NEVER BE REACHED
		default:
			return { symbol: p, name: '', canonical: '', count: 0 };
	}
};
