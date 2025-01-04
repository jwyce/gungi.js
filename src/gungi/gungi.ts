import pc from 'picocolors';
import { Color, Piece } from './utils';

type PGN = {
	date: string;
	white: string;
	black: string;
	result: string;
	fen: string;
	movetext: string;
};

type Options = {
	pgn?: PGN;
	fen?: string;
};

export class Gungi {
	private _board: (`${Color}${Piece}` | null)[][][];

	constructor(opts?: Options) {
		this._board = [];
	}

	print() {
		console.log(pc.dim(pc.yellow(1)));
		console.log(pc.yellow(1));
		console.log(pc.dim(pc.blue(2)));
		console.log(pc.blue(2));
		console.log(pc.dim(pc.green(3)));
		console.log(pc.green(3));
	}
}
