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
declare class Gungi {
    private _board;
    constructor(opts?: Options);
    print(): void;
}

type Color = 'b' | 'w';
type Piece = '帥' | '大' | '中' | '小' | '侍' | '槍' | '馬' | '忍' | '砦' | '兵' | '砲' | '弓' | '筒' | '謀';
type Name = 'marshal' | 'general' | 'lieutenant_general' | 'major_general' | 'warrior' | 'lancer' | 'rider' | 'spy' | 'fortress' | 'soldier' | 'cannon' | 'archer' | 'musketeer' | 'tactician';
declare const piece: Record<Name, Piece>;
declare const getPieceInfo: (p: Piece) => {
    symbol: Piece;
    name: string;
    canonical: string;
    count: number;
};

export { type Color, Gungi, type Name, type Piece, getPieceInfo, piece };
