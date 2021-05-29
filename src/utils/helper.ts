import { Piece } from './../interfaces/igungi';
import { StockPiece } from '../interfaces/igungi';
import {
	ARCHER,
	CANNON,
	CAPTAIN,
	FORTRESS,
	GENERAL,
	KNIGHT,
	LIEUTENANT_GENERAL,
	MAJOR_GENERAL,
	MARSHAL,
	MUSKETEER,
	PAWN,
	SAMURAI,
	SPY,
} from './constants';

export const init_stockpile = (color: 'b' | 'w'): StockPiece[] => {
	return new Array(
		{
			piece: {
				type: MARSHAL,
				color,
			},
			amount: 1,
		},
		{
			piece: {
				type: PAWN,
				color,
			},
			amount: 9,
		},
		{
			piece: {
				type: SPY,
				color,
			},
			amount: 2,
		},
		{
			piece: {
				type: CANNON,
				color,
			},
			amount: 2,
		},
		{
			piece: {
				type: FORTRESS,
				color,
			},
			amount: 2,
		},
		{
			piece: {
				type: SAMURAI,
				color,
			},
			amount: 2,
		},
		{
			piece: {
				type: CAPTAIN,
				color,
			},
			amount: 1,
		},
		{
			piece: {
				type: MUSKETEER,
				color,
			},
			amount: 1,
		},
		{
			piece: {
				type: KNIGHT,
				color,
			},
			amount: 2,
		},
		{
			piece: {
				type: ARCHER,
				color,
			},
			amount: 2,
		},
		{
			piece: {
				type: GENERAL,
				color,
			},
			amount: 6,
		},
		{
			piece: {
				type: LIEUTENANT_GENERAL,
				color,
			},
			amount: 4,
		},
		{
			piece: {
				type: MAJOR_GENERAL,
				color,
			},
			amount: 4,
		}
	);
};

export const put = (
	board: Array<Array<Array<Piece | null>>>,
	piece: Piece | null,
	square: string
) => {
	let rank = parseInt(square.split('-')[0]);
	let file = parseInt(square.split('-')[1]);
	let top = get_top(board, square);
	let tier = top == null ? 1 : top.tier + 1;

	if (tier > 3 || !piece) {
		return null;
	}

	board[9 - rank][file - 1][tier - 1] = {
		type: piece.type,
		color: piece.color,
	};

	return {
		piece,
		tier,
	};
};

export const get = (
	board: Array<Array<Array<Piece | null>>>,
	square: string
) => {
	let rank = parseInt(square.split('-')[0]);
	let file = parseInt(square.split('-')[1]);

	return board[9 - rank][file - 1];
};

export const get_top = (
	board: Array<Array<Array<Piece | null>>>,
	square: string
) => {
	let tower = get(board, square);

	for (let i = 2; i >= 0; i--) {
		if (tower[i] !== null) {
			return {
				piece: tower[i],
				tier: i + 1,
			};
		}
	}

	return null;
};

export const remove = (
	board: Array<Array<Array<Piece | null>>>,
	square: string
) => {
	let tower = get(board, square);

	for (let i = 2; i >= 0; i--) {
		if (tower[i] !== null) {
			let temp = tower[i];
			tower[i] = null;
			return temp;
		}
	}

	return null;
};

export const remove_stockpile = (stockpile: StockPiece[], piece: Piece) => {
	var stockPiece = stockpile.find(
		(x) => x.piece.type === piece.type && x.piece.color === piece.color
	);

	if (!stockPiece) {
		return null;
	}

	if (stockPiece.amount === 0) {
		return null;
	}
	stockPiece.amount--;
	return stockPiece;
};
