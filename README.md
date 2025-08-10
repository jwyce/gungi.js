# gungi.js

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/jwyce/gungi.js/ci.yml)](https://github.com/jwyce/gungi.js/actions)
[![npm](https://img.shields.io/npm/v/gungi.js?color=blue)](https://www.npmjs.com/package/gungi.js)
[![npm](https://img.shields.io/npm/dm/gungi.js)](https://www.npmjs.com/package/gungi.js)

gungi.js is a TypeScript gungi library for the strategy game from the HUNTER×HUNTER manga. It implements the "official rules" trying to be as faithful as possible to what is shown in HUNTER×HUNTER.
Credit to these two reddit posts from [u/magickirua](https://www.reddit.com/r/HunterXHunter/comments/uqrtct/gungi_the_official_rules) and [u/MythicalTenshi](https://www.reddit.com/r/HunterXHunter/comments/105f43g/comment/j3evkkq)
which translate the rule book.

gungi.js is used for move generation/validation, piece placement/movement, piece ID tracking, and endgame detection - basically everything but the AI.

## Installation

Run the following command to install the most recent version of gungi.js from NPM:

```
npm install gungi.js
```

## Example Code

The code below plays a random game of gungi:

```ts
import { ADVANCED_POSITION, Gungi } from './gungi';

function clearTerminal() {
	process.stdout.write('\x1b[2J');
	process.stdout.write('\x1b[H');
}

function printText(text: string) {
	clearTerminal();
	process.stdout.write(text);
}

const gungi = new Gungi(ADVANCED_POSITION);

while (!gungi.isGameOver()) {
	const moves = gungi.moves();
	const move = moves[Math.floor(Math.random() * moves.length)];
	gungi.move(move);
	printText(gungi.ascii());
}

console.log(gungi.fen() + '\n');
console.log(gungi.pgn());
```

## API

### Constants

```js
// colors
const WHITE = 'w';
const BLACK = 'b';

// special moves
export const TSUKE = '付';
export const TAKE = '取';
export const BETRAY = '返';
export const ARATA = '新';

// pieces
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

// starting positions (in FEN)
export const INTRO_POSITION =
	'3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWDWF1D/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 w 0 - 1';
export const BEGINNER_POSITION =
	'3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1';
export const INTERMEDIATE_POSITION =
	'9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 2 wb 1';
export const ADVANCED_POSITION =
	'9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 3 wb 1';

// square list
export const SQUARES = ['1-1', '1-2', '1-3', ..., '7-1', '8-1', '9-1']

// map of pieces to japanese names (romaji)
export const CANONICAL_NAMES = { 帥: 'sui', ..., 弓: 'yumi', 筒: 'tsutsu', 謀: 'boushou' }

// map of pieces to english names
export const ENGLISH_NAMES = { 帥: 'marshal', ..., 弓: 'archer', 筒: 'cannon', 謀: 'tactician' }

// map of pieces to fen code symbols
export const FEN_CODES  = { 帥: 'm', ..., 弓: 'a', 筒: 'c', 謀: 't' }
```

### Constructor: Gungi([ fen ])

The Gungi() constructor takes an optional parameter which specifies the board configuration in a special variant of [Forsyth-Edwards Notation (FEN)](https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation).
Throws an exception if an invalid FEN string is provided. See specification differences [here](src/gungi/fen.ts).

```ts
import { Gungi } from 'gungi.js'

// an empty constructor defaults the starting position
let gungi = new Gungi()

// pass in a FEN string to load a particular position
let gungi = new Gungi(
  'd1f1|r:d||r:j|j|k:a:c||g:s|/3|w:s|2|n:w|2/f8/3n2d1m/2i4W1/3dN1tR1/4D2R1/ASJ2|C:a|1A1/|I:F:W|F1SGMT1|K:J| -/- w 3 - 57',
)

```

### .ascii([ options ])

Returns a string containing an ASCII diagram of the current position with ANSI colors. Options is an optional parameter which may contain a 'english' flag to display the pieces in English symbols.

```ts
const gungi = new Gungi(BEGINNER_POSITION);

// make some moves
gungi.move('槍(8-5-1)(7-5-2)付');
gungi.move('新馬(1-7-1)');
gungi.move('新忍(8-7-2)付');

gungi.ascii();
// -> '　９８７６５４３２１
//     ＋ーーーーーーーーー＋
//     ｜・・馬中帥大・・・｜１
//     ｜・馬弓・槍・弓忍・｜２
//     ｜兵・砦侍兵侍砦・兵｜３
//     ｜・・・・・・・・・｜４
//     ｜・・・・・・・・・｜５
//     ｜・・・・・・・・・｜６
//     ｜兵・砦侍槍侍砦・兵｜７
//     ｜・忍忍・・・弓馬・｜８
//     ｜・・・大帥中・・・｜９
//     ＋ーーーーーーーーー＋'
gungi.ascii({ english: true });
// -> '　９８７６５４３２１
//     ＋ーーーーーーーーー＋
//     ｜・・ｒｉｍｇ・・・｜１
//     ｜・ｒａ・ｎ・ａｓ・｜２
//     ｜ｄ・ｆｗｄｗｆ・ｄ｜３
//     ｜・・・・・・・・・｜４
//     ｜・・・・・・・・・｜５
//     ｜・・・・・・・・・｜６
//     ｜Ｄ・ＦＷＮＷＦ・Ｄ｜７
//     ｜・ＳＳ・・・ＡＲ・｜８
//     ｜・・・ＧＭＩ・・・｜９
//     ＋ーーーーーーーーー＋'
```

### .board()

Returns a 3D tensor representation of the current position (9x9x3 array). Empty squares are represented by `null`.

```ts
const gungi = new Gungi();

gungi.board();
// -> [[[null],
//  	[null],
//    	[null],
//    	[{ square: '1-6', tier: 1, type: '中', color: 'b' }],
//    	[{ square: '1-5', tier: 1, type: '帥', color: 'b' }],
//    	[{ square: '1-4', tier: 1, type: '大', color: 'b' }],
//    	[null],
//    	[null],
//    	[null]],
//     [[null],
//    	[{ square: '2-8', tier: 1, type: '忍', color: 'b' }],
//    	[null],
//    	[null],
//    	[{ square: '2-5', tier: 1, type: '槍', color: 'b' }],
//    	[null],
//    	[null],
//    	[{ square: '2-2', tier: 1, type: '忍', color: 'b' }],
//    	[null]],
//    [[{ square: '3-9', tier: 1, type: '兵', color: 'b' }],
//    	[null],
//    	[{ square: '3-7', tier: 1, type: '砦', color: 'b' }],
//    	[{ square: '3-6', tier: 1, type: '侍', color: 'b' }],
//    	[{ square: '3-5', tier: 1, type: '兵', color: 'b' }],
//    	[{ square: '3-4', tier: 1, type: '侍', color: 'b' }],
//    	[{ square: '3-3', tier: 1, type: '砦', color: 'b' }],
//    	[null],
//    	[{ square: '3-1', tier: 1, type: '兵', color: 'b' }]],
//    [...],
//    [...],
//    [...],
//    [[{ square: '7-9', tier: 1, type: '兵', color: 'w' }],
//    	[null],
//    	[{ square: '7-7', tier: 1, type: '砦', color: 'w' }],
//    	[{ square: '7-6', tier: 1, type: '侍', color: 'w' }],
//    	[{ square: '7-5', tier: 1, type: '兵', color: 'w' }],
//    	[{ square: '7-4', tier: 1, type: '侍', color: 'w' }],
//    	[{ square: '7-3', tier: 1, type: '砦', color: 'w' }],
//    	[null],
//    	[{ square: '7-1', tier: 1, type: '兵', color: 'w' }]],
//    [[null],
//    	[{ square: '8-8', tier: 1, type: '忍', color: 'w' }],
//    	[null],
//    	[null],
//    	[{ square: '8-5', tier: 1, type: '槍', color: 'w' }],
//    	[null],
//    	[null],
//    	[{ square: '8-2', tier: 1, type: '忍', color: 'w' }],
//    	[null]],
//    [[null],
//    	[null],
//    	[null],
//    	[{ square: '9-6', tier: 1, type: '大', color: 'w' }],
//    	[{ square: '9-5', tier: 1, type: '帥', color: 'w' }],
//    	[{ square: '9-4', tier: 1, type: '中', color: 'w' }],
//    	[null],
//    	[null],
//    	[null]]];
```

### .captured(color)

Returns a list of pieces captured. Color is an optional parameter to filter pieces by player color

```ts
const gungi = new Gungi(BEGINNER_POSITION);
gungi.move('新小(7-5-2)付');
gungi.move('兵(3-5-1)(4-5-1)');
gungi.move('新槍(7-4-2)付');
gungi.move('兵(4-5-1)(5-5-1)');
gungi.move('小(7-5-2)取(5-5-1)');

gungi.captured('b');
// -> [{ type: '兵', color: 'b', count: 1 }]
```

### .clear()

Clears the board.

```ts
gungi.clear();
gungi.fen();
// -> '9/9/9/9/9/9/9/9/9 M1G1I1J2W2N3R2S2F2D4C1A2K1T1/m1g1i1j2w2n3r2s2f2d4c1a2k1t1 w 3 wb 1' <- empty board
```

### .fen()

Returns the FEN string for the current position.

```ts
const gungi = new Gungi(BEGINNER_POSITION);

// make some moves
gungi.move('槍(8-5-1)(7-5-2)付');
gungi.move('新馬(1-7-1)');
gungi.move('新忍(8-7-2)付');

gungi.fen();
// -> '2rimg3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FW|D:N|WF1D/1S|A:S|3AR1/3GMI3 J2N2R1D1/j2n2s1d1 b 1 - 2'
```

### .get(square)

Returns the tower of pieces on the square. Returns `undefined` if the square is empty.

```ts
const gungi = new Gungi(BEGINNER_POSITION);

gungi.move('砦(7-3-1)(7-4-2)付');

gungi.get('7-4');
// -> [{ square: '7-4', tier: 1, type: '侍', color: 'w' }, { square: '7-4', tier: 2, type: '砦', color: 'w' }]
gungi.get('7-3');
// -> undefined
```

### .getDraftingRights(color)

Gets the drafting rights for the given color. Boolean value is return if color provided, otherwise returns an object with both colors.

```ts
const gungi = new Gungi(ADVANCED_POSITION);

gungi.move('新帥(7-2-1)終');

gungi.getDraftingRights();
// -> { w: false, b: true }
gungi.getDraftingRights('b');
// -> true
```

### .getBoardWithIds()

Returns a copy of the 3D board tensor with all piece ID information included. Each piece object includes an `id` field with its unique identifier.

```ts
const gungi = new Gungi(BEGINNER_POSITION);
const boardWithIds = gungi.getBoardWithIds();

// Access piece with ID
const piece = boardWithIds[6][0][0]; // 7-1 square
// -> { square: '7-1', tier: 1, type: '兵', color: 'w', id: '兵-w-1' }
```

### .getTop(square)

Returns the top piece of the tower on the square. Returns `undefined` if the square is empty.

```ts
const gungi = new Gungi(BEGINNER_POSITION);

gungi.get('7-4');
// -> [{ square: '7-4', tier: 1, type: '侍', color: 'w' }]
gungi.get('7-3');
// -> undefined
```

### .getHandPieceId(type, color, index)

Returns the ID of a specific hand piece by type, color, and index. Useful for selecting which specific piece to play when multiple pieces of the same type are in hand.

```ts
const gungi = new Gungi(BEGINNER_POSITION);

// Get ID of first major general in white's hand
const firstId = gungi.getHandPieceId('小', 'w', 0);
// -> '小-w-1'

// Get ID of second major general (if exists)
const secondId = gungi.getHandPieceId('小', 'w', 1);
// -> '小-w-2' or undefined if only one exists
```

### .getHandPieceIds(type?, color?)

Returns an array of all hand piece IDs. Can optionally filter by piece type and color.

```ts
const gungi = new Gungi(BEGINNER_POSITION);

// Get all white major general IDs
const whiteGeneralIds = gungi.getHandPieceIds('小', 'w');
// -> ['小-w-1', '小-w-2']

// Get all hand piece IDs
const allHandIds = gungi.getHandPieceIds();
// -> ['小-w-1', '小-w-2', '槍-w-1', ..., '小-b-1', '小-b-2', ...]
```

### .getHandWithIds(color?)

Returns hand pieces with individual ID arrays included. Similar to `.hand()` but includes the `ids` field for each hand piece.

```ts
const gungi = new Gungi(BEGINNER_POSITION);

const whiteHandWithIds = gungi.getHandWithIds('w');
// -> [
//      { type: '小', count: 2, color: 'w', ids: ['小-w-1', '小-w-2'] },
//      { type: '槍', count: 3, color: 'w', ids: ['槍-w-1', '槍-w-2', '槍-w-3'] },
//      ...
//    ]
```

### .getPieceById(id)

Returns the piece object with the specified ID. Searches the entire board to find the piece.

```ts
const gungi = new Gungi(BEGINNER_POSITION);

// Find piece by its unique ID
const piece = gungi.getPieceById('兵-w-1');
// -> { square: '7-1', tier: 1, type: '兵', color: 'w', id: '兵-w-1' }

// Returns undefined if piece doesn't exist or was captured
const nonexistent = gungi.getPieceById('兵-w-999');
// -> undefined
```

### .getPieceId(square, tier?)

Returns the unique ID of the piece at the specified location. If tier is omitted, returns the ID of the top piece.

```ts
const gungi = new Gungi(BEGINNER_POSITION);

// Get ID of top piece at square
const topPieceId = gungi.getPieceId('7-1');
// -> '兵-w-1'

// Get ID of piece at specific tier
const specificTierId = gungi.getPieceId('7-4', 2); // After stacking
// -> '砦-w-1'

// Returns undefined if no piece at location
const emptyId = gungi.getPieceId('5-5');
// -> undefined
```

### .hand(color)

Returns a list of pieces in players' hand. Color is an optional parameter to filter pieces by player color

```ts
const gungi = new Gungi(BEGINNER_POSITION);

// make some moves
gungi.move('槍(8-5-1)(7-5-2)付');
gungi.move('新馬(1-7-1)');
gungi.move('新忍(8-7-2)付');

gungi.hand();
// -> [
//      { type: '小', count: 2, color: 'w' },
//      { type: '槍', count: 2, color: 'w' },
//      { type: '馬', count: 1, color: 'w' },
//      { type: '兵', count: 1, color: 'w' },
//      { type: '小', count: 2, color: 'b' },
//      { type: '槍', count: 2, color: 'b' },
//      { type: '忍', count: 1, color: 'b' },
//      { type: '兵', count: 1, color: 'b' }
//    ]
gungi.hand('w');
//    [
//      { type: '小', count: 2, color: 'w' },
//      { type: '槍', count: 2, color: 'w' },
//      { type: '馬', count: 1, color: 'w' },
//      { type: '兵', count: 1, color: 'w' }
//    ]
```

### .history([ options ])

Returns a list containing the moves of the current game. Options is an optional parameter which may contain a 'verbose' flag. See .moves() for a description of the verbose move fields.
A FEN string of the position prior to the move being made is added to the verbose history output.

```ts
const gungi = new Gungi(BEGINNER_POSITION);
gungi.move('新小(7-5-2)付');
gungi.move('兵(3-5-1)(4-5-1)');
gungi.move('新槍(7-4-2)付');
gungi.move('兵(4-5-1)(5-5-1)');
gungi.move('小(7-5-2)取(5-5-1)');

gungi.history();
// -> ['砦(7-3-1)(7-4-2)付', '新小(7-5-2)付', '兵(3-5-1)(4-5-1)', '新槍(7-4-2)付', '兵(4-5-1)(5-5-1)', '小(7-5-2)取(5-5-1)']

gungi.history({ verbose: true });
// -->
// [
//   {
//     piece: '砦',
//     color: 'w',
//     from: '7-3-1',
//     to: '7-4-2',
//     type: 'tsuke',
//     san: '砦(7-3-1)(7-4-2)付',
//     before: '3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWDWF1D/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 w 0 - 1',
//     after: '3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWD|W:F|2D/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 b 0 - 1',
//   },
//   {
//     piece: '小',
//     color: 'w',
//     from: '',
//     to: '7-5-2',
//     type: 'arata',
//     san: '新小(7-5-2)付',
//     before: '3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWDWF1D/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 w 0 - 1',
//     after: '3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FW|D:J|WF1D/1S2N2S1/3GMI3 J1N2R2D1/j2n2r2d1 b 0 - 1',
//   },
//   {
//     piece: '兵',
//     color: 'b',
//     from: '3-5-1',
//     to: '4-5-1',
//     type: 'route',
//     san: '兵(3-5-1)(4-5-1)',
//     before: '3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FW|D:J|WF1D/1S2N2S1/3GMI3 J1N2R2D1/j2n2r2d1 b 0 - 1',
//     after: '3img3/1s2n2s1/d1fw1wf1d/4d4/9/9/D1FW|D:J|WF1D/1S2N2S1/3GMI3 J1N2R2D1/j2n2r2d1 w 0 - 2',
//   },
//   {
//     piece: '槍',
//     color: 'w',
//     from: '',
//     to: '7-4-2',
//     type: 'arata',
//     san: '新槍(7-4-2)付',
//     before: '3img3/1s2n2s1/d1fw1wf1d/4d4/9/9/D1FW|D:J|WF1D/1S2N2S1/3GMI3 J1N2R2D1/j2n2r2d1 w 0 - 2',
//     after: '3img3/1s2n2s1/d1fw1wf1d/4d4/9/9/D1FW|D:J||W:N|F1D/1S2N2S1/3GMI3 J1N1R2D1/j2n2r2d1 b 0 - 2',
//   },
//   {
//     piece: '兵',
//     color: 'b',
//     from: '4-5-1',
//     to: '5-5-1',
//     type: 'route',
//     san: '兵(4-5-1)(5-5-1)',
//     before: '3img3/1s2n2s1/d1fw1wf1d/4d4/9/9/D1FW|D:J||W:N|F1D/1S2N2S1/3GMI3 J1N1R2D1/j2n2r2d1 b 0 - 2',
//     after: '3img3/1s2n2s1/d1fw1wf1d/9/4d4/9/D1FW|D:J||W:N|F1D/1S2N2S1/3GMI3 J1N1R2D1/j2n2r2d1 w 0 - 3',
//   },
//   {
//     piece: '小',
//     color: 'w',
//     from: '7-5-2',
//     to: '5-5-1',
//     type: 'capture',
//     san: '小(7-5-2)取(5-5-1)',
//     before: '3img3/1s2n2s1/d1fw1wf1d/9/4d4/9/D1FW|D:J||W:N|F1D/1S2N2S1/3GMI3 J1N1R2D1/j2n2r2d1 w 0 - 3',
//     after: '3img3/1s2n2s1/d1fw1wf1d/9/4J4/9/D1FWD|W:N|F1D/1S2N2S1/3GMI3 J1N1R2D1/j2n2r2d1 b 0 - 3',
//     captured: [ { square: '5-5', tier: 1, type: '兵', color: 'b' } ]
//   }
// ]
```

### .inDraft()

Returns true or false if either player is still in the drafting phase.

```ts
const gungi = new Gungi(ADVANCED_POSITION);

gungi.move('新帥(7-2-1)終');
gungi.inDraft();
// -> true

gungi.move('新帥(2-4-1)終');
gungi.inDraft();
// -> false
```

### .isFourfoldRepetition()

Returns true or false if the current board position has occurred four or more times.

```ts
const gungi = new Gungi(INTRO_POSITION);
// 3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWDWF1D/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 w 0 - 1 occurs 1st time
gungi.isFourfoldRepetition();
// -> false

gungi.move('兵(7-1-1)(6-1-1)');
gungi.move('侍(3-4-1)(4-4-1)');
gungi.move('兵(6-1-1)(7-1-1)');
gungi.move('侍(4-4-1)(3-4-1)');
// 3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWDWF1D/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 w 0 - 1 occurs 2nd time
gungi.isFourfoldRepetition();
// -> false

gungi.move('兵(7-1-1)(6-1-1)');
gungi.move('侍(3-4-1)(4-4-1)');
gungi.move('兵(6-1-1)(7-1-1)');
gungi.move('侍(4-4-1)(3-4-1)');
// 3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWDWF1D/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 w 0 - 1 occurs 3rd time
gungi.isFourfoldRepetition();
// -> false

gungi.move('兵(7-1-1)(6-1-1)');
gungi.move('侍(3-4-1)(4-4-1)');
gungi.move('兵(6-1-1)(7-1-1)');
gungi.move('侍(4-4-1)(3-4-1)');
// 3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWDWF1D/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 w 0 - 1 occurs 4th time
gungi.isFourfoldRepetition();
// -> true
```

### .isGameOver()

Returns true if the game has ended via either marshal catpured or fourfold repetition. Otherwise, returns false.

```ts
const gungi = new Gungi(ADVANCED_POSITION);
gungi.isGameOver();
// -> false

// marshal captured
gungi.load(
	'1|g:N|2|W:N|Ad1f/7r1/1nd2Adfr/2|c:G|j2K2/6s1D/1w|W:T|6/2F4J|F:D|/i8/2|S:w||R:M|3C1 -/- b 3 - 164'
);
gungi.isGameOver();
// -> true
```

### .load(fen)

Clears the board and loads the provided FEN string. Throws an exception if the FEN is invalid.

```ts
const gungi = new Gungi();
gungi.load(
	'd1f1|r:d||r:j|j|k:a:c||g:s|/3|w:s|2|n:w|2/f8/3n2d1m/2i4W1/3dN1tR1/4D2R1/ASJ2|C:a|1A1/|I:F:W|F1SGMT1|K:J| -/- w 3 - 57'
);

try {
	gungi.load('3img3/1ra1n1xas1/d1fwdwf1d/9/9/9/9/9 J2N2R1D1/j2n2r2d1 w 1 - 1');
} catch (e) {
	console.log(e.message);
}
// -> Error: Invalid FEN: 1st field (piece positions) is invalid [expected 9 ranks, received 8]
```

### .loadPgn(pgn, fen, [ options ])

Load the moves of a game stored in [Portable Game Notation](http://en.wikipedia.org/wiki/Portable_Game_Notation). `pgn` should be a string. `fen` should be the starting position of the game (defaults to `ADVANCED_POSITION`).
Options is an optional object which may contain a string `newline`. PGN for gungi is slightly different from standard PGN, read more about it [here](src/gungi/pgn.ts).

The `newline` is a string representation of a valid RegExp fragment and is used to process the PGN. It defaults to `\n`

```ts
const gungi = new Gungi(ADVANCED_POSITION);
const pgn = [
	'1.新帥(7-9-1)終 新帥(1-5-1) 新小(2-8-1) 新謀(1-2-1) 新馬(2-8-2)付 新大(3-4-1)終',
	'2.帥(7-9-1)(8-8-1) 新砦(3-2-1) 3.新謀(8-2-1) 新弓(1-8-1) 4.新弓(9-9-1) 新馬(1-3-1)',
	'5.新筒(9-5-1) 新弓(1-8-2)付 6.新兵(8-5-1) 新砦(3-6-1) 7.新大(8-9-1) 砦(3-6-1)(2-5-1)',
	'8.新小(8-9-2)付 新小(1-7-1) 9.新槍(8-2-2)付 新侍(1-2-2)付 10.新兵(9-8-1) 小(1-7-1)(2-7-1)',
	'11.新槍(8-6-1) 新侍(2-4-1) 12.新砦(9-9-2)付 侍(2-4-1)(3-3-1) 13.小(8-9-2)(7-8-1) 新兵(1-4-1)',
];

gungi.loadPgn(pgn.join('\n'));
gungi.print();
// -> '　９８７６５４３２１
//     ＋ーーーーーーーーー＋
//     ｜・弓・・帥兵馬侍・｜１
//     ｜・馬小・砦・・・・｜２
//     ｜・・・・・大侍砦・｜３
//     ｜・・・・・・・・・｜４
//     ｜・・・・・・・・・｜５
//     ｜・・・・・・・・・｜６
//     ｜・小・・・・・・・｜７
//     ｜大帥・槍兵・・槍・｜８
//     ｜砦兵・・筒・・・・｜９
//     ＋ーーーーーーーーー＋'
```

### .move(move, [ options ])

Makes a move on the board and returns a move object if the move was legal. The move argument can be either a string in Standard Algebraic Notation (SAN) or a move object.
Throws an 'Illegal move' exception if the move was illegal.

#### move() - Standard Algebraic Notation (SAN)

```ts
const gungi = new Gungi(INTRO_POSITION);
gungi.move('兵(7-1-1)(6-1-1)');
// -> {
//      piece: '兵',
//      color: 'w',
//      from: '7-1-1',
//      to: '6-1-1',
//      type: 'route',
//      san: '兵(7-1-1)(6-1-1)',
//      before: '3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWDWF1D/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 w 0 - 1',
//      after: '3img3/1s2n2s1/d1fwdwf1d/9/9/8D/D1FWDWF2/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 b 0 - 1',
//    }
gungi.move('大(1-4-1)(2-10-1)');
// Error: Invalid move: 大(1-4-1)(2-10-1)
```

#### .move() - Object Notation

A move object contains `to`, `from`, `piece`, `type` and, `captured` and `draftFinished` (only when necessary) fields.

```ts
const gungi = new Gungi(INTRO_POSITION);
gungi.move({ piece: SOLIDER, from: '7-1-1', to: '6-1-1', type: 'route' });
// -> {
//      piece: '兵',
//      color: 'w',
//      from: '7-1-1',
//      to: '6-1-1',
//      type: 'route',
//      san: '兵(7-1-1)(6-1-1)',
//      before: '3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWDWF1D/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 w 0 - 1',
//      after: '3img3/1s2n2s1/d1fwdwf1d/9/9/8D/D1FWDWF2/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 b 0 - 1',
//    }
```

### .moveNumber()

Returns the current move number.

```ts
gungi.load(
	'd1f1|r:d||r:j|j|k:a:c||g:s|/3|w:s|2|n:w|2/f8/3n2d1m/2i4W1/3dN1tR1/4D2R1/ASJ2|C:a|1A1/|I:F:W|F1SGMT1|K:J| -/- w 3 - 57'
);
gungi.moveNumber();
// -> 57
```

### .moves({ square?: Square, arata?: HandPiece, verbose = false} = {})

Returns a list of legal moves from the current position. This function takes an optional object which can be used to generate detailed move objects or to restrict the move generator to specific squares or arata.

```ts
const gungi = new Gungi(INTRO_POSITION);
gungi.moves();
// -> [
//      '兵(7-1-1)(6-1-1)',   '兵(7-1-1)(8-1-1)',   '砦(7-3-1)(6-3-1)',
//      '砦(7-3-1)(7-4-2)付', '砦(7-3-1)(7-2-1)',   '砦(7-3-1)(8-4-1)',
//      '砦(7-3-1)(8-2-2)付', '侍(7-4-1)(6-5-1)',   '侍(7-4-1)(6-4-1)',
//      '侍(7-4-1)(6-3-1)',   '侍(7-4-1)(8-4-1)',   '兵(7-5-1)(6-5-1)',
//      '兵(7-5-1)(8-5-2)付', '侍(7-6-1)(6-7-1)',   '侍(7-6-1)(6-6-1)',
//      '侍(7-6-1)(6-5-1)',   '侍(7-6-1)(8-6-1)',   '砦(7-7-1)(6-7-1)',
//      '砦(7-7-1)(7-8-1)',   '砦(7-7-1)(7-6-2)付', '砦(7-7-1)(8-8-2)付',
//      '砦(7-7-1)(8-6-1)',   '兵(7-9-1)(6-9-1)',   '兵(7-9-1)(8-9-1)',
//      '忍(8-2-1)(7-3-2)付', '忍(8-2-1)(7-1-2)付', '忍(8-2-1)(9-3-1)',
//      '忍(8-2-1)(9-1-1)',   '槍(8-5-1)(7-6-2)付', '槍(8-5-1)(7-5-2)付',
//      '槍(8-5-1)(7-4-2)付', '忍(8-8-1)(7-9-2)付', '忍(8-8-1)(7-7-2)付',
//      '忍(8-8-1)(9-9-1)',   '忍(8-8-1)(9-7-1)',   '中(9-4-1)(8-5-2)付',
//      '中(9-4-1)(8-4-1)',   '中(9-4-1)(8-3-1)',   '中(9-4-1)(7-2-1)',
//      '中(9-4-1)(6-1-1)',   '中(9-4-1)(9-3-1)',   '帥(9-5-1)(8-6-1)',
//      '帥(9-5-1)(8-5-2)付', '帥(9-5-1)(8-4-1)',   '帥(9-5-1)(9-6-2)付',
//      '帥(9-5-1)(9-4-2)付', '大(9-6-1)(8-7-1)',   '大(9-6-1)(8-6-1)',
//      '大(9-6-1)(7-6-2)付', '大(9-6-1)(8-5-2)付', '大(9-6-1)(9-7-1)',
//      '大(9-6-1)(9-8-1)',   '大(9-6-1)(9-9-1)',   '新小(9-1-1)',
//      '新小(9-2-1)',        '新小(9-3-1)',        '新小(9-4-2)付',
//      '新小(9-6-2)付',      '新小(9-7-1)',        '新小(9-8-1)',
//      '新小(9-9-1)',        '新小(8-1-1)',        '新小(8-2-2)付',
//      '新小(8-3-1)',        '新小(8-4-1)',        '新小(8-5-2)付',
//      '新小(8-6-1)',        '新小(8-7-1)',        '新小(8-8-2)付',
//      '新小(8-9-1)',        '新小(7-1-2)付',      '新小(7-2-1)',
//      '新小(7-3-2)付',      '新小(7-4-2)付',      '新小(7-5-2)付',
//      '新小(7-6-2)付',      '新小(7-7-2)付',      '新小(7-8-1)',
//      '新小(7-9-2)付',      '新槍(9-1-1)',        '新槍(9-2-1)',
//      '新槍(9-3-1)',        '新槍(9-4-2)付',      '新槍(9-6-2)付',
//      '新槍(9-7-1)',        '新槍(9-8-1)',        '新槍(9-9-1)',
//      '新槍(8-1-1)',        '新槍(8-2-2)付',      '新槍(8-3-1)',
//      '新槍(8-4-1)',        '新槍(8-5-2)付',      '新槍(8-6-1)',
//      '新槍(8-7-1)',        '新槍(8-8-2)付',      '新槍(8-9-1)',
//      '新槍(7-1-2)付',      '新槍(7-2-1)',        '新槍(7-3-2)付',
//      '新槍(7-4-2)付',
//      ... 57 more items
//    ]

gungi.moves({ square: '8-5' }); // single square move generation
// -> ['槍(8-5-1)(7-6-2)付', '槍(8-5-1)(7-5-2)付', '槍(8-5-1)(7-4-2)付']

gungi.moves({ arata: gungi.hand('w').at(0) }); // generate moves for arata
// -> [
//      '新小(9-1-1)',   '新小(9-2-1)',
//      '新小(9-3-1)',   '新小(9-4-2)付',
//      '新小(9-6-2)付', '新小(9-7-1)',
//      '新小(9-8-1)',   '新小(9-9-1)',
//      '新小(8-1-1)',   '新小(8-2-2)付',
//      '新小(8-3-1)',   '新小(8-4-1)',
//      '新小(8-5-2)付', '新小(8-6-1)',
//      '新小(8-7-1)',   '新小(8-8-2)付',
//      '新小(8-9-1)',   '新小(7-1-2)付',
//      '新小(7-2-1)',   '新小(7-3-2)付',
//      '新小(7-4-2)付', '新小(7-5-2)付',
//      '新小(7-6-2)付', '新小(7-7-2)付',
//      '新小(7-8-1)',   '新小(7-9-2)付'
//    ]

gungi.moves({ verbose: true }); // return verbose moves
/// -> [{ piece: '兵', color: 'w', from: '7-1-1', to: '6-1-1',
///        type: 'route',
///        san: '兵(7-1-1)(6-1-1)',
///        before: '3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FWDWF1D/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 w 0 - 1',
///        after: '3img3/1s2n2s1/d1fwdwf1d/9/9/8D/D1FWDWF2/1S2N2S1/3GMI3 J2N2R2D1/j2n2r2d1 b 0 - 1',
///        # a `draftFinished` field is included when a move is ending the drafting phase
///        # a `captured` field is included when a move is a capture or a betrayal
///      },
///      ...
///      ]
```

#### Move Object (e.g. when { verbose: true })

The `color` field indicates the color of the moving piece (`w` or `b`).

The `from` and `to` fields are from and to squares in algebraic notation.

The `type` field is the type of move made (`route`, `tsuke`, `capture`, `betray`, `arata`).

The `piece` and `captured` fields contain the lowercase representation of the applicable piece (mgijwnrsfdcakt). The captured field are only present when the move is a valid capture or betrayal.

The `draftFinished` field is included when a move is ending the drafting phase.

The `san` field is the move in Standard Algebraic Notation (SAN).

The `before` and `after` keys contain the FEN of the position before and after the move.

### .pgn([ options ])

Returns the game in PGN format. Options is an optional parameter which may include max width and/or a newline character settings.

```ts
const gungi = new Gungi(BEGINNER_POSITION);
gungi.move('槍(8-5-1)(7-5-2)付');
gungi.move('新馬(1-7-1)');
gungi.move('新忍(8-7-2)付');

gungi.pgn({ maxWidth: 2, newlineChar: '<br />' });
// -> '1. 槍(8-5-1)(7-5-2)付 新馬(1-7-1) <br />2. 新忍(8-7-2)付'
```

### .print()

Print the ascii representation of the board to the console.

### .reset()

Reset the board to the initial starting position.

### .turn()

Returns the current side to move.

```ts
gungi.load(
	'3img3/1s2n2s1/d1fwdwf1d/9/9/9/D1FW|D:J|WF1D/1S2N2S1/3GMI3 J1N2R2D1/j2n2r2d1 b 0 - 1'
);
gungi.turn();
// -> 'b'
```

### .undo()

Takeback the last half-move, returning a move object if successful, otherwise null.

```ts
const gungi = new Gungi(BEGINNER_POSITION);

gungi.fen();
// -> '3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1'
gungi.move('兵(7-1-1)(6-1-1)');
gungi.fen();
// -> '3img3/1ra1n1as1/d1fwdwf1d/9/9/8D/D1FWDWF2/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 1'

gungi.undo();
//  {
//    piece: '兵',
//    color: 'w',
//    from: '7-1-1',
//    to: '6-1-1',
//    type: 'route',
//    san: '兵(7-1-1)(6-1-1)',
//    before: '3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1',
//    after: '3img3/1ra1n1as1/d1fwdwf1d/9/9/8D/D1FWDWF2/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 b 1 - 1',
//  }

gungi.fen();
// -> '3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 1 - 1'
gungi.undo();
// -> null
```

### validateFen(fen):

This static function returns a validation object specifying validity or the errors found within the FEN string.

```ts
import { validateFen } from 'gungi.js';

validateFen(
	'3img3/1s2n2s1/d1fw1wf1d/9/4J4/9/D1FWD|W:N|F1D/1S2N2S1/3GMI3 J1N1R2D1/j2n2r2d1 b 0 - 3'
);
// -> { ok: true }

validateFen('3img3/1ra1n1xas1/d1fwdwf1d/9/9/9/9/9/9 J2N2R1D1/j2n2r2d1 w 1 - 1');
// -> { ok: false,
//      error: '1st field (piece positions) is invalid [invalid piece] @(2-7)' }
```
