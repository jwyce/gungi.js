# gungi.js

![npm](https://img.shields.io/npm/dw/gungi.js?color=%231ED760&logo=npm)
![GitHub](https://img.shields.io/github/license/jwyce/gungi.js)

gungi.js is a JavaScript library which contains all the necessary logic for the strategy game from the HUNTER×HUNTER manga and it implements the [rules](https://www.docdroid.net/P4r6Fvq/gungi.pdf) established by reddit users [u/Zaneme](https://www.reddit.com/user/Zaneme) and [u/squal777](https://www.reddit.com/user/squal777).

The library is used for move generation / validation, piece placement / movement, and check / checkmate / stalemate detection - basically everything but the AI.

## Installation

To install the latest stable version of `gungi.js`

```
# NPM
npm install gungi.js

# Yarn
yarn add gungi.js
```

## Example Code

The code below plays a random game of gungi:

```js
const { Gungi } = require('gungi.js');
const gungi = new Gungi()

while (!gungi.game_over()) {       
    const moves = gungi.moves()
    const move = moves[Math.floor(Math.random() * moves.length)]
    gungi.move(move)
}
console.log(gungi.ascii())
```

## API

### Constants

```js
    // colors
    const BLACK = 'b';
    const WHITE = 'w';

    // move types
    const ATTACK = 'attack';
    const MOVEMENT = 'move';
    const STACK = 'stack';
    const PLACE = 'place';
    const READY = 'ready';

    // piece types
    const MAJOR_GENERAL = '小';
    const LIEUTENANT_GENERAL = '中';
    const GENERAL = '大';
    const ARCHER = '弓';
    const KNIGHT = '馬';
    const MUSKETEER = '筒';
    const CAPTAIN = '謀';
    const SAMURAI = '侍'
    const FORTRESS = '砦';
    const CANNON = '砲';
    const SPY = '忍';
    const PAWN = '兵';
    const MARSHAL = '帥';
```

### .ascii()

Returns a string containing an ASCII diagram of the current position. 

**Note about notation:** Position on the 3D board is defined by rank (row), file (column), and tier (height). Standard Japanese number characters are used for the tier of white pieces and formal number characters are used for the tier of black pieces.

```js
// const TIER1_WHITE = '一';
// const TIER2_WHITE = '二';
// const TIER3_WHITE = '三';
// const TIER1_BLACK = '壱';
// const TIER2_BLACK = '弐';
// const TIER3_BLACK = '参';

const gungi = new Gungi()

// make some moves
gungi.move({src: {type: gungi.MARSHAL, color: gungi.BLACK}, dst: '7-2', type: gungi.PLACE})
gungi.move({src: {type: gungi.MARSHAL, color: gungi.WHITE}, dst: '2-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.PAWN, color: gungi.BLACK}, dst: '8-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.PAWN, color: gungi.WHITE}, dst: '1-5', type: gungi.PLACE})

gungi.ascii()
// ->   +-----------------------------------------------------+
//      |                                                     |
//  ｒ9 |  。。  。。  。。  。。  。。  。。  。。  。。  。。　｜
//      |                                                     |
//  ｒ8 |  。。  。。  。。  。。  壱兵  。。  。。  。。  。。　｜
//      |                                                     |
//  ｒ7 |  。。  壱帥  。。  。。  。。  。。  。。  。。  。。　｜
//      |                                                     |
//  ｒ6 |  。。  。。  。。  。。  。。  。。  。。  。。  。。　｜
//      |                                                     |
//  ｒ5 |  。。  。。  。。  。。  。。  。。  。。  。。  。。　｜
//      |                                                     |
//  ｒ4 |  。。  。。  。。  。。  。。  。。  。。  。。  。。　｜
//      |                                                     |
//  ｒ3 |  。。  。。  。。  。。  。。  。。  。。  。。  。。　｜
//      |                                                     |
//  ｒ2 |  。。  。。  。。  。。  一帥  。。  。。  。。  。。　｜
//      |                                                     |
//  ｒ1 |  。。  。。  。。  。。  一兵  。。  。。  。。  。。　｜
//      |                                                     |
//      +-----------------------------------------------------+
//         ｆ１  ｆ２  ｆ３  ｆ４  ｆ５  ｆ６  ｆ７  ｆ８  ｆ９
```

### .get_board()

Returns a tensor representation of the current position (9x9x3 array). Empty squares are represented by `null`.

```js
const gungi = new Gungi()
gungi.move({src: {type: gungi.MARSHAL, color: gungi.BLACK}, dst: '7-2', type: gungi.PLACE})
gungi.move({src: {type: gungi.MARSHAL, color: gungi.WHITE}, dst: '2-5', type: gungi.PLACE})

gungi.get_board()
// -> [
  [...],
  [...],
  [
    [ null, null, null ],
    [ {type: '帥', color: 'b'}, null, null ],
    [ null, null, null ],
    [ null, null, null ],
    [ null, null, null ],
    [ null, null, null ],
    [ null, null, null ],
    [ null, null, null ],
    [ null, null, null ]
  ],
  [...],
  [...],
  [...],
  [...],
  [
    [ null, null, null ],
    [ null, null, null ],
    [ null, null, null ],
    [ null, null, null ],
    [ {type: '帥', color: 'w'}, null, null ],
    [ null, null, null ],
    [ null, null, null ],
    [ null, null, null ],
    [ null, null, null ]
  ],
  [...]
]
```

### .game_over()

Returns true if the game has ended via checkmate or stalemate. Otherwise, returns false.

### .get(square)

Returns the tower of pieces on the square:

```js
const gungi = new Gungi()

gungi.move({src: {type: gungi.MARSHAL, color: gungi.BLACK}, dst: '7-2', type: gungi.PLACE})
gungi.move({src: {type: gungi.MARSHAL, color: gungi.WHITE}, dst: '2-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.PAWN, color: gungi.BLACK}, dst: '8-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.PAWN, color: gungi.WHITE}, dst: '1-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.ARCHER, color: gungi.BLACK}, dst: '8-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.SPY, color: gungi.WHITE}, dst: '1-5', type: gungi.PLACE})

gungi.get('8-5')
// -> [ { type: '兵', color: 'b' }, { type: '弓', color: 'b' }, null ]
```

### .get_top(square)

Returns the top piece of the tower on the square:

```js
const gungi = new Gungi()

gungi.move({src: {type: gungi.MARSHAL, color: gungi.BLACK}, dst: '7-2', type: gungi.PLACE})
gungi.move({src: {type: gungi.MARSHAL, color: gungi.WHITE}, dst: '2-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.PAWN, color: gungi.BLACK}, dst: '8-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.PAWN, color: gungi.WHITE}, dst: '1-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.ARCHER, color: gungi.BLACK}, dst: '8-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.SPY, color: gungi.WHITE}, dst: '1-5', type: gungi.PLACE})

gungi.get_top('8-5')
// -> { piece: { type: '弓', color: 'b' }, tier: 2 }
```

### .in_checkmate()

Returns true or false if the side to move has been checkmated. *(i.e. has no legal moves and is currently in check)*

### .in_check()

Returns true or false if the side to move is in check.

```js
const gungi = new Gungi()

gungi.move({src: {type: gungi.MARSHAL, color: gungi.BLACK}, dst: '7-2', type: gungi.PLACE})
gungi.move({src: {type: gungi.MARSHAL, color: gungi.WHITE}, dst: '2-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.PAWN, color: gungi.BLACK}, dst: '8-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.PAWN, color: gungi.WHITE}, dst: '1-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.CAPTAIN, color: gungi.BLACK}, dst: '8-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.ARCHER, color: gungi.WHITE}, dst: '1-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.MUSKETEER, color: gungi.BLACK}, dst: '8-5', type: gungi.PLACE})

gungi.in_check()
// -> true
```

### .in_stalemate()

Returns true or false if the side to move has been stalemated *(i.e. has no legal moves and is currently **not** in check)*

### .move(move)

Attempts to make a move on the board, returning a move object if the move was legal, otherwise null. 

```js
    // example moves
    gungi.move({src: {type: gungi.ARCHER, color: gungi.WHITE}, dst: '3-9', type: gungi.PLACE})

    gungi.move({src: null, dst: null, type: gungi.READY}) // used only in draft phase 

    gungi.move({src: '1-1', dst: '2-1', type: gungi.STACK})

    gungi.move({src: '1-1', dst: '2-1', type: gungi.ATTACK})

    gungi.move({src: '1-1', dst: '1-2', type: gungi.MOVEMENT})
```

### .moves([ options ])

Returns a list of legal moves from the current position. The function takes an optional parameter which controls the single-square move generation and stockpile move generation.

```js
const gungi = new Gungi()


gungi.move({src: {type: gungi.MARSHAL, color: gungi.BLACK}, dst: '7-2', type: gungi.PLACE})
gungi.move({src: {type: gungi.MARSHAL, color: gungi.WHITE}, dst: '2-5', type: gungi.PLACE})
gungi.move({src: null, dst: null, type: gungi.READY})
gungi.move({src: {type: gungi.PAWN, color: gungi.WHITE}, dst: '1-5', type: gungi.PLACE})
gungi.move({src: {type: gungi.PAWN, color: gungi.WHITE}, dst: '1-6', type: gungi.PLACE})
gungi.move({src: {type: gungi.PAWN, color: gungi.WHITE}, dst: '1-7', type: gungi.PLACE})
gungi.move({src: {type: gungi.PAWN, color: gungi.WHITE}, dst: '1-8', type: gungi.PLACE})
gungi.move({src: null, dst: null, type: gungi.READY})

gungi.moves()
// ->[
  // { src: '1-6', dst: '2-6', type: 'move' },
  // { src: '1-7', dst: '2-7', type: 'move' },
  // { src: '1-8', dst: '2-8', type: 'move' },
  // { src: '2-5', dst: '1-4', type: 'move' },
  // { src: '2-5', dst: '1-5', type: 'stack' },
  // { src: '2-5', dst: '1-6', type: 'stack' },
  // { src: '2-5', dst: '2-4', type: 'move' },
  // { src: '2-5', dst: '2-6', type: 'move' },
  // { src: '2-5', dst: '3-4', type: 'move' },
  // { src: '2-5', dst: '3-5', type: 'move' },
  // { src: '2-5', dst: '3-6', type: 'move' },
  // { src: { type: '兵', color: 'w' }, dst: '1-1', type: 'place' },
  // { src: { type: '兵', color: 'w' }, dst: '1-2', type: 'place' },
  // { src: { type: '兵', color: 'w' }, dst: '1-3', type: 'place' },
  // ... 605 more items

  gungi.moves({square: '2-5'})  // single square move generation
  // -> [
//   { src: '2-5', dst: '1-4', type: 'move' },
//   { src: '2-5', dst: '1-5', type: 'stack' },
//   { src: '2-5', dst: '1-6', type: 'stack' },
//   { src: '2-5', dst: '2-4', type: 'move' },
//   { src: '2-5', dst: '2-6', type: 'move' },
//   { src: '2-5', dst: '3-4', type: 'move' },
//   { src: '2-5', dst: '3-5', type: 'move' },
//   { src: '2-5', dst: '3-6', type: 'move' }
// ]

gungi.moves({stock_piece: gungi.ARCHER}) // move generation for stockpile piece
// -> [
//   { src: { type: '弓', color: 'w' }, dst: '1-1', type: 'place' },
//   { src: { type: '弓', color: 'w' }, dst: '1-2', type: 'place' },
//   { src: { type: '弓', color: 'w' }, dst: '1-3', type: 'place' },
//   { src: { type: '弓', color: 'w' }, dst: '1-4', type: 'place' },
//   { src: { type: '弓', color: 'w' }, dst: '1-5', type: 'place' },
//   { src: { type: '弓', color: 'w' }, dst: '1-6', type: 'place' },
//   { src: { type: '弓', color: 'w' }, dst: '1-7', type: 'place' },
//   { src: { type: '弓', color: 'w' }, dst: '1-8', type: 'place' },
//   { src: { type: '弓', color: 'w' }, dst: '1-9', type: 'place' },
//   { src: { type: '弓', color: 'w' }, dst: '2-1', type: 'place' },
//   { src: { type: '弓', color: 'w' }, dst: '2-2', type: 'place' },
//   { src: { type: '弓', color: 'w' }, dst: '2-3', type: 'place' },
// ... 30 more items
// ]
```

### .get_stockpile([ options ])

Returns a list of pieces from the player's current stockpiles. This function takes an optional parameter which filters the stockpile by player color.

```js
const gungi = new Gungi()

gungi.get_stockpile()
// -> [
//   { piece: { type: '帥', color: 'w' }, amount: 1 },
//   { piece: { type: '兵', color: 'w' }, amount: 9 },
//   { piece: { type: '忍', color: 'w' }, amount: 2 },
//   { piece: { type: '砲', color: 'w' }, amount: 2 },
//   { piece: { type: '砦', color: 'w' }, amount: 2 },
//   { piece: { type: '侍', color: 'w' }, amount: 2 },
//   { piece: { type: '謀', color: 'w' }, amount: 1 },
//   { piece: { type: '筒', color: 'w' }, amount: 1 },
//   { piece: { type: '馬', color: 'w' }, amount: 2 },
//   { piece: { type: '弓', color: 'w' }, amount: 2 },
//   { piece: { type: '大', color: 'w' }, amount: 6 },
//   { piece: { type: '中', color: 'w' }, amount: 4 },
//   { piece: { type: '小', color: 'w' }, amount: 4 },
//   { piece: { type: '帥', color: 'b' }, amount: 1 },
//   { piece: { type: '兵', color: 'b' }, amount: 9 },
//   { piece: { type: '忍', color: 'b' }, amount: 2 },
//   { piece: { type: '砲', color: 'b' }, amount: 2 },
//   { piece: { type: '砦', color: 'b' }, amount: 2 },
//   { piece: { type: '侍', color: 'b' }, amount: 2 },
//   { piece: { type: '謀', color: 'b' }, amount: 1 },
//   { piece: { type: '筒', color: 'b' }, amount: 1 },
//   { piece: { type: '馬', color: 'b' }, amount: 2 },
//   { piece: { type: '弓', color: 'b' }, amount: 2 },
//   { piece: { type: '大', color: 'b' }, amount: 6 },
//   { piece: { type: '中', color: 'b' }, amount: 4 },
//   { piece: { type: '小', color: 'b' }, amount: 4 }
// ]

gungi.get_stockpile(gungi.BLACK)
// -> [
//   { piece: { type: '帥', color: 'b' }, amount: 1 },
//   { piece: { type: '兵', color: 'b' }, amount: 9 },
//   { piece: { type: '忍', color: 'b' }, amount: 2 },
//   { piece: { type: '砲', color: 'b' }, amount: 2 },
//   { piece: { type: '砦', color: 'b' }, amount: 2 },
//   { piece: { type: '侍', color: 'b' }, amount: 2 },
//   { piece: { type: '謀', color: 'b' }, amount: 1 },
//   { piece: { type: '筒', color: 'b' }, amount: 1 },
//   { piece: { type: '馬', color: 'b' }, amount: 2 },
//   { piece: { type: '弓', color: 'b' }, amount: 2 },
//   { piece: { type: '大', color: 'b' }, amount: 6 },
//   { piece: { type: '中', color: 'b' }, amount: 4 },
//   { piece: { type: '小', color: 'b' }, amount: 4 }
// ]
```

### .get_army_size(color)

Returns how many pieces given side currently has on the board (max 26)

### .get_captured([ options ])

Returns a list of captured pieces. This function takes an optional parameter which filters the stockpile by player color.

### .get_history()

Returns a list of all previous moves made.

### .turn

Property representing the current side to move

```js
const gungi = new Gungi()

gungi.turn
// -> 'b'
gungi.move({src: {type: gungi.MARSHAL, color: gungi.BLACK}, dst: '7-2', type: gungi.PLACE})

gungi.turn
// -> 'w'
gungi.move({src: {type: gungi.MARSHAL, color: gungi.WHITE}, dst: '2-5', type: gungi.PLACE})
```

### .phase

Property representing the current phase of the game

```js
const gungi = new Gungi()

gungi.move({src: {type: gungi.MARSHAL, color: gungi.BLACK}, dst: '7-2', type: gungi.PLACE})
gungi.move({src: {type: gungi.MARSHAL, color: gungi.WHITE}, dst: '2-5', type: gungi.PLACE})

gungi.phase
// -> 'draft'

gungi.move({src: null, dst: null, type: gungi.READY})
gungi.move({src: null, dst: null, type: gungi.READY})

gungi.phase
// -> 'game'
```
