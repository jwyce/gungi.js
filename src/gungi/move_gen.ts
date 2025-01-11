import { encodeFEN, parseFEN } from './fen';
import {
	Color,
	convert,
	get,
	getTop,
	HandPiece,
	Move,
	Piece,
	PieceType,
	piece as pieceType,
	put,
	remove,
	removeTop,
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

	const availableSquares: string[] = [];

	// first probe in the reverse direction until origin is reached to see if there are any pieces in the way
	const reverse = { x, y };
	while (reverse.x !== px || reverse.y !== py) {
		reverse.x -= dx;
		reverse.y -= dy;
		const piece = getTop(`${reverse.y}-${reverse.x}`, board);
		if (piece && piece.tier > originPiece.tier) {
			return [];
		}

		const side = originPiece.color === 'b' ? -1 : 1;
		const below = getTop(`${reverse.y + side}-${reverse.x}`, board);

		if (below && below.square === `${py}-${px}`) break;
	}

	// then probe in the forward direction to see if there are any pieces in the way
	const forward = { x, y };
	let step = 0;
	while (step < length) {
		if (forward.x < 1 || forward.x > 9 || forward.y < 1 || forward.y > 9) break;

		const piece = getTop(`${forward.y}-${forward.x}`, board);
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

export function generateMovesForSquare(square: string, fen: string) {
	const { board, turn, mode, hand } = parseFEN(fen);
	const piece = getTop(square, board);
	if (!piece || turn !== piece.color) return [];

	const [py, px] = square.split('-').map(Number);

	const probes = pieceProbes[piece.type];
	const squares = probes.flatMap((probe, i) => {
		const pval = typeof probe === 'number' ? probe : probe[0];
		const pcarry = typeof probe === 'number' ? 1 : probe[1];
		if (pval < 1) return [];

		let [dy, dx] = dirs[i];
		if (piece.color === 'b') {
			dy *= -1;
			dx *= -1;
		}

		const [y, x] =
			pval === Infinity ? [py + dy, px + dx] : [py + pval * dy, px + dx];
		const length = pval === Infinity ? Infinity : piece.tier + pcarry - 1;

		return getAvailableSquares([dy, dx], [y, x], [py, px], length, board);
	});

	return squares.reduce((acc, s) => {
		const p = getTop(s, board);
		const t = get(s, board);

		const maxTier = mode === 'advanced' ? 3 : 2;

		if (!p || !t) {
			acc.push(createMove(piece, `${s}-1`, fen, 'route'));
		} else {
			// tsuke
			if (p.tier < maxTier && p.type !== pieceType.marshal) {
				acc.push(createMove(piece, `${s}-${p.tier + 1}`, fen, 'tsuke'));

				// betrayal
				if (piece.type === pieceType.tactician && p.color !== piece.color) {
					const enemies = t.filter((p) => p.color !== piece.color);
					const playerHand = hand.filter((p) => p.color === piece.color);
					const enemyCountMap = enemies.reduce((acc, e) => {
						acc.set(e.type, (acc.get(e.type) ?? 0) + 1);
						return acc;
					}, new Map<PieceType, number>());

					const betrayalOptions = Array.from(enemyCountMap.entries())
						.filter(([type, count]) =>
							playerHand.some((p) => p.type === type && p.count >= count)
						)
						.flatMap(([type]) => enemies.filter((e) => e.type === type));

					const combos = generateCombinations(betrayalOptions);
					acc.push(
						...combos.map((combo) =>
							createMove(piece, `${s}-${p.tier + 1}`, fen, 'betray', combo)
						)
					);
				}
			}

			// capture
			if (p.color !== piece.color) {
				const newTier = t.filter((p) => p.color === piece.color).length + 1;
				const captured = t.filter((p) => p.color !== piece.color);
				acc.push(
					createMove(piece, `${s}-${newTier}`, fen, 'capture', captured)
				);
			}
		}

		return acc;
	}, [] as Move[]);
}

function generateArata() {}

function createMove(
	piece: Piece,
	to: string,
	fen: string,
	type: Move['type'],
	captured?: Piece[],
	draftFinished?: boolean
) {
	const from = piece.tier !== 0 ? `(${piece.square}-${piece.tier})` : '';
	const toTier = +(to.split('-').at(-1) ?? 0);
	const arata = type === 'arata' ? '新' : '';
	const capture = type === 'capture' ? '取' : '';
	const tsuke = type === 'tsuke' || toTier - piece.tier > 0 ? '付' : '';
	const betray =
		type === 'betray' ? `返${captured?.map((p) => p.type).join('')}` : '';
	const draftDone = draftFinished ? '終' : '';

	const move: Move = {
		piece: piece.type,
		color: piece.color,
		from: from.slice(1, -1),
		to,
		type,
		san: `${arata}${piece.type}${from}${capture}(${to})${betray || tsuke}${draftDone}`,
		before: fen,
		after: '',
		draftFinished,
		captured,
	};

	const { after, gameOverSAN } = makeMove(move, move.before);
	move.after = after;
	move.san += gameOverSAN;

	return move;
}

function makeMove(move: Move, fen: string) {
	let { board, hand, mode, turn, drafting, moveNumber } = parseFEN(fen);
	const [file, rank, tier] = move.to.split('-');
	const to = {
		type: move.piece,
		color: move.color,
		square: `${file}-${rank}`,
		tier: +tier,
	};

	if (move.type === 'route' || move.type === 'tsuke') {
		removeTop(move.from!, board);
	} else if (move.type === 'capture') {
		removeTop(move.from!, board);
		remove(`${file}-${rank}`, move.captured!, board);
	} else if (move.type === 'betray') {
		removeTop(move.from!, board);
		convert(`${file}-${rank}`, move.captured!, board);
	}

	put(to, board);
	if (turn === 'b') moveNumber++;
	turn = turn === 'b' ? 'w' : 'b';

	return {
		after: encodeFEN({ board, hand, mode, turn, drafting, moveNumber }),
		// check marshal captured
		// check fourfold repetition
		gameOverSAN: '',
	};
}

function generateCombinations<T>(items: T[]): T[][] {
	const result: T[][] = [];

	function helper(start: number, currentCombination: T[]) {
		if (currentCombination.length > 0) {
			result.push([...currentCombination]);
		}

		for (let i = start; i < items.length; i++) {
			currentCombination.push(items[i]);
			helper(i + 1, currentCombination);
			currentCombination.pop(); // Backtrack
		}
	}

	helper(0, []);

	return result;
}
