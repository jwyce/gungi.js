import {
	getTop,
	Piece,
	PieceType,
	piece as pieceType,
	SetupMode,
} from './utils';

export const dirs = [
	[-1, 1],
	[-1, 0],
	[-1, -1],
	[0, 1],
	[0, -1],
	[1, 1],
	[1, 0],
	[1, -1],
];

export const pieceProbes: Record<PieceType, (number[] | number)[]> = {
	帥: [1, 1, 1, 1, 1, 1, 1, 1],
	大: [1, Infinity, 1, Infinity, Infinity, 1, Infinity, 1],
	中: [Infinity, 1, Infinity, 1, 1, Infinity, 1, Infinity],
	小: [1, 1, 1, 1, 1, 0, 1, 0],
	侍: [1, 1, 1, 0, 0, 0, 1, 0],
	槍: [1, [1, 2], 1, 0, 0, 0, 1, 0],
	馬: [0, [1, 2], 0, 1, 1, 0, [1, 2], 0],
	忍: [[1, 2], 0, [1, 2], 0, 0, [1, 2], 0, [1, 2]],
	砦: [0, 1, 0, 1, 1, 1, 0, 1],
	兵: [0, 1, 0, 0, 0, 0, 1, 0],
	砲: [0, 3, 0, 1, 1, 0, 1, 0],
	弓: [2, 2, 2, 0, 0, 0, 1, 0],
	筒: [0, 2, 0, 0, 0, 1, 0, 1],
	謀: [1, 0, 1, 0, 0, 0, 1, 0],
};

function getAvailableSquares(
	dir: [number, number],
	start: [number, number],
	origin: [number, number],
	length: number,
	board: (Piece | null)[][][]
) {
	const [y, x] = start;
	const [py, px] = origin;
	const [dy, dx] = dir;
	const originPiece = getTop(`${py}-${px}`, board)!;
	console.log({ originPiece });

	const availableSquares: string[] = [];

	// first probe in the reverse direction until origin is reached to see if there are any pieces in the way
	const reverse = { x, y };
	while (reverse.x !== px || reverse.y !== py) {
		reverse.x -= dx;
		reverse.y -= dy;
		const piece = getTop(`${reverse.y}-${reverse.x}`, board);
		console.log('reverse', { piece });
		if (piece && piece.tier > originPiece.tier) {
			return [];
		}
	}

	// then probe in the forward direction to see if there are any pieces in the way
	const forward = { x, y };
	let step = 0;
	while (step < length) {
		console.log({ forward });
		if (forward.x < 1 || forward.x > 9 || forward.y < 1 || forward.y > 9) break;

		const piece = getTop(`${forward.y}-${forward.x}`, board);
		console.log('forward', { piece });
		if (piece && piece.tier > originPiece.tier) break;

		availableSquares.push(`${forward.y}-${forward.x}`);

		const leapPieces = [
			pieceType.cannon,
			pieceType.musketeer,
			pieceType.archer,
		];
		if (piece && !leapPieces.includes(originPiece.type)) break;

		forward.x += dx;
		forward.y += dy;
		step++;
	}

	return availableSquares;
}

export function generateMovesForSquare(
	square: string,
	board: (Piece | null)[][][],
	mode: SetupMode
) {
	const piece = getTop(square, board);
	if (!piece) return [];

	const [py, px] = square.split('-').map(Number);
	console.log('square', py, px);

	const probes = pieceProbes[piece.type];
	console.log({ probes });
	const squares = probes.flatMap((probe, i) => {
		const pval = typeof probe === 'number' ? probe : probe[0];
		const pcarry = typeof probe === 'number' ? 1 : probe[1];
		console.log({ pval, pcarry });
		if (pval < 1) return [];

		const [dy, dx] = dirs[i];
		console.log('dir', dy, dx);
		const [y, x] =
			pval === Infinity ? [py + dy, px + dx] : [py + pval * dy, px + pval * dx];
		console.log('start', y, x);
		const length = piece.tier + pcarry - 1;
		console.log({ length });

		return getAvailableSquares([dy, dx], [y, x], [py, px], length, board);
	});

	return squares;
}
