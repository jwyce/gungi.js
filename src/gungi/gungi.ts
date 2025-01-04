import pc from 'picocolors';
import { Color, Piece } from './utils';

type Options = {
	pgn?: {
		date: string;
		white: string;
		black: string;
		result: string;
		fen: string;
		movetext: string;
	};
};

export class Gungi {
	private _board: (`${Color}${Piece}` | null)[][][];

	constructor(opts?: Options) {
		this._board = [];
	}

	print() {}
}
