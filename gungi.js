/**The MIT License (MIT)
 *
 * Copyright (c) 2020-2021 Jared Wyce <wycejared@gmail.com>
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 *----------------------------------------------------------------------------*/

var Gungi = function () {
    const BLACK = 'b';
    const WHITE = 'w';

    const DRAFT = 'draft';
    const GAME = 'game';

    const ATTACK = 'attack';
    const MOVEMENT = 'move';
    const STACK = 'stack';
    const PLACE = 'place';
    const READY = 'ready';

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
    const MARSHALL = '帥';

    const TIER1_WHITE = '一';
    const TIER2_WHITE = '二';
    const TIER3_WHITE = '三';
    const TIER1_BLACK = '壱';
    const TIER2_BLACK = '弐';
    const TIER3_BLACK = '参';

    var RANK_1 = 1;
    var RANK_3 = 3;
    var RANK_4 = 4;
    var RANK_6 = 6;
    var RANK_7 = 7;
    var RANK_9 = 9;

    var FILE_1 = 1;
    var FILE_9 = 9;

    var board = Array(9).fill().map(e => Array(9).fill().map(e => Array(3).fill(null).map(e => e)));
    var turn = BLACK;
    var phase = DRAFT;
    var half_moves = 0;
    var history = [];
    var stockpile = [];
    var captured = [];
    var drafted = {
        w: 0,
        b: 0
    };
    var marshall_placed = {
        w: 0,
        b: 0
    };
    var army_size = {
        w: 0,
        b: 0
    };

    init_stockpile = (color) => {
        var stockpile = [{
                piece: {
                    type: MARSHALL,
                    color: color
                },
                amount: 1
            },
            {
                piece: {
                    type: PAWN,
                    color: color
                },
                amount: 9
            },
            {
                piece: {
                    type: SPY,
                    color: color
                },
                amount: 2
            },
            {
                piece: {
                    type: CANNON,
                    color: color
                },
                amount: 2
            },
            {
                piece: {
                    type: FORTRESS,
                    color: color
                },
                amount: 2
            },
            {
                piece: {
                    type: SAMURAI,
                    color: color
                },
                amount: 2
            },
            {
                piece: {
                    type: CAPTAIN,
                    color: color
                },
                amount: 1
            },
            {
                piece: {
                    type: MUSKETEER,
                    color: color
                },
                amount: 1
            },
            {
                piece: {
                    type: KNIGHT,
                    color: color
                },
                amount: 2
            },
            {
                piece: {
                    type: ARCHER,
                    color: color
                },
                amount: 2
            },
            {
                piece: {
                    type: GENERAL,
                    color: color
                },
                amount: 6
            },
            {
                piece: {
                    type: LIEUTENANT_GENERAL,
                    color: color
                },
                amount: 4
            },
            {
                piece: {
                    type: MAJOR_GENERAL,
                    color: color
                },
                amount: 4
            }
        ];
        return stockpile;
    }

    Array.prototype.push.apply(stockpile, init_stockpile(WHITE));
    Array.prototype.push.apply(stockpile, init_stockpile(BLACK));

    isValidPiece = (piece) => {
        if (typeof piece.piece !== 'undefined') {
            piece = {type: piece.piece.type, color: piece.piece.color};
        }

        return [MAJOR_GENERAL, LIEUTENANT_GENERAL, GENERAL, ARCHER, MUSKETEER, KNIGHT, CAPTAIN, SAMURAI, FORTRESS, SPY, CANNON, PAWN, MARSHALL].includes(piece.type) && [BLACK, WHITE].includes(piece.color);
    }

    isSquareOutOfBounds = (rank, file) => {
        return isNaN(rank) || isNaN(file) || rank < RANK_1 || rank > RANK_9 || file < FILE_1 || file > FILE_9;
    }

    put = (piece, square) => {
        if (!isValidPiece(piece)) {
            return null;
        }

        var input = square.split("-");
        var rank = parseInt(input[0]);
        var file = parseInt(input[1]);

        if (isSquareOutOfBounds(rank, file)) {
            return null;
        }

        var top = get_top(square);
        var tier = top == null ? 1 : top.tier + 1;
        if (tier > 3) {
            return null;
        }
        board[9 - rank][file - 1][tier - 1] = {type: piece.type, color: piece.color};
        return {
            piece: piece,
            tier: tier
        }
    }

    get = (square) => {
        var input = square.split("-");
        var rank = parseInt(input[0]);
        var file = parseInt(input[1]);

        if (isSquareOutOfBounds(rank, file)) {
            return null;
        }

        return board[9 - rank][file - 1];
    }

    get_top = (square) => {
        var tower = get(square);
        if (tower === null) {
            return null;
        }

        for (var i = 2; i >= 0; i--) {
            if (tower[i] !== null) {
                return {
                    piece: tower[i],
                    tier: i + 1
                };
            }
        }

        return null;
    }

    remove = (square) => {
        var tower = get(square);
        if (tower === null) {
            return null;
        }

        for (var i = 2; i >= 0; i--) {
            if (tower[i] !== null) {
                var temp = tower[i];
                tower[i] = null;
                return temp;
            }
        }

        return null;
    }

    get_stockpile = (color) => {
        if (color == null) {
            return stockpile;
        }

        return stockpile.filter(x => x.piece.color == color);
    }

    remove_stockpile = (piece) => {
        if (!isValidPiece(piece)) {
            return null;
        }

        var stockPiece = stockpile.find(x => x.piece.type == piece.type && x.piece.color == piece.color);
        if (stockPiece.amount == 0) {
            return null;
        }
        stockPiece.amount--;
        return stockPiece;
    }

    get_captured = (color) => {
        if (color == null) {
            return captured;
        }

        return captured.filter(x => x.piece.color == color);
    }

    in_check = () => {
        var is_in_check = false;
        var vision = [];

        for (var i = RANK_1; i <= RANK_9; i++) {
            for (var j = FILE_1; j <= FILE_9; j++) {
                var square = i + '-' + j;
                var src = get_top(square);
                if (src != null && src.piece.color != turn) {
                    var probes = single_sqaure_move_gen(src, square);
                    vision = vision.concat(probes);
                }
            }
        }

        vision.forEach(square => {
            var top = get_top(square.rank + '-' + square.file);
            if (top != null && top.piece.type == MARSHALL && top.piece.color == turn) {
                is_in_check = true;
            }
        });

        return is_in_check;
    }

    in_checkmate = () => {
        return in_check() && moves().length == 0;
    }

    in_stalemate = () => {
        return !in_check() && moves().length == 0;
    }

    game_over = () => {
        return in_checkmate() || in_stalemate();
    }

    pgn = () => {
        var readyCount = 0;
        var fullMoveNumber = 1;
        var pgn = 'DRAFT PHASE';
        for (var i = 0; i < history.length; i++) {
            var move = history[i];
            if (move.half_move_number % 2 != 0) {
                pgn += '\n' + fullMoveNumber + '. ';
                fullMoveNumber++;
            }
            switch (move.type) {
                case PLACE:
                    pgn += `${move.turn} (stockpile ${move.move.src.type}) place (${move.move.dst}-${move.to.tier}),   `;
                    break;
                case READY:
                    pgn += `${move.turn} ready,   `;
                    readyCount++;
                    if (readyCount == 2) {
                        pgn += '\nGAME PHASE\n';
                    }
                    break;
                default:
                    pgn += `${move.turn} (${move.move.src}-${move.from.tier} ${move.from.piece.type}) ${move.move.type} (${move.move.dst}-${move.to.tier}),   `;
                    break;
            }
        }

        return pgn;
    }

    generate_moves_from_probes = (probes, src, square) => {
        var moves = [];

        probes.forEach(x => {
            var pos = x.rank + '-' + x.file;
            var dst = get_top(pos);

            if (dst == null) {
                moves.push({
                    src: square,
                    dst: pos,
                    type: MOVEMENT
                });
            } else {
                if (dst.tier < 3 && dst.piece.type != MARSHALL && src.piece.type != FORTRESS) { // pieces can't stack on marshall and fortress can't stack on other pieces
                    moves.push({
                        src: square,
                        dst: pos,
                        type: STACK
                    });
                }
                if (dst.piece.color != turn) {
                    moves.push({
                        src: square,
                        dst: pos,
                        type: ATTACK
                    });
                }
            }
        });

        return moves;
    }

    get_squares_around = (square, ignore_list) => {
        var squares = [];

        var input = square.split("-");
        var rank = parseInt(input[0]);
        var file = parseInt(input[1]);

        for (var i = rank - 1; i <= rank + 1; i++) {
            for (var j = file - 1; j <= file + 1; j++) {

                var valid_square = !isSquareOutOfBounds(i, j);
                ignore_list.forEach(item => {
                    valid_square = valid_square && (i != rank + item.rank_offset || j != file + item.file_offset);
                });

                if (valid_square) {
                    squares.push({
                        rank: i,
                        file: j
                    });
                }
            }
        }

        return squares;
    }

    /**
     * * returns valid moves probing from from given square
     * @probes the moves to be probed
     * @depth inter that determines how deep to probe
     * @directions boolean array of direction to dermine where to probe
     * 0: right path
     * 1: left path
     * 2: up path
     * 3: down path
     * 4: up-right path
     * 5: up-left path
     * 6: down-right path
     * 7: down-left path
     */
    probe_directions = (square, depth, directions) => {
        var input = square.split("-");
        var rank = parseInt(input[0]);
        var file = parseInt(input[1]);

        var squares = [];
        var found = Array(8).fill(false);
        var probes = Array(8).fill(null);

        for (var i = 1; i <= depth; i++) {
            probes.splice(0, 0, {
                rank: rank,
                file: file + i
            });
            probes.splice(1, 0, {
                rank: rank,
                file: file - i
            });
            probes.splice(2, 0, {
                rank: rank + i,
                file: file
            });
            probes.splice(3, 0, {
                rank: rank - i,
                file: file
            });
            probes.splice(4, 0, {
                rank: rank + i,
                file: file + i
            });
            probes.splice(5, 0, {
                rank: rank + i,
                file: file - i
            });
            probes.splice(6, 0, {
                rank: rank - i,
                file: file + i
            });
            probes.splice(7, 0, {
                rank: rank - i,
                file: file - i
            });

            for (var j = 0; j < 8; j++) {
                if (directions[j] && !isSquareOutOfBounds(probes[j].rank, probes[j].file) && !found[j]) {
                    squares.push(probes[j]);
                    found[j] = get_top(probes[j].rank + '-' + probes[j].file) != null;
                }
            }
        }

        return squares;
    }

    single_sqaure_move_gen = (src, square) => {
        var moves = [];

        var input = square.split("-");
        var rank = parseInt(input[0]);
        var file = parseInt(input[1]);

        if (!isValidPiece(src)) {
            return null;
        }

        switch (src.piece.type) {
            case MAJOR_GENERAL:
                switch (src.tier) {
                    case 1:
                        var probes = [];

                        if (src.piece.color == BLACK) {
                            if (!isSquareOutOfBounds(rank - 1, file + 1)) {
                                probes.push({
                                    rank: rank - 1,
                                    file: file + 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank - 1, file - 1)) {
                                probes.push({
                                    rank: rank - 1,
                                    file: file - 1
                                });
                            }
                        } else {
                            if (!isSquareOutOfBounds(rank + 1, file + 1)) {
                                probes.push({
                                    rank: rank + 1,
                                    file: file + 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 1, file - 1)) {
                                probes.push({
                                    rank: rank + 1,
                                    file: file - 1
                                });
                            }
                        }

                        moves = moves.concat(probes);
                        break;
                    case 2:
                        var probes = [];

                        var ignore_squares_white = [{
                            rank_offset: 0,
                            file_offset: 0
                        }, {
                            rank_offset: 0,
                            file_offset: -1
                        }, {
                            rank_offset: 0,
                            file_offset: 1
                        }, {
                            rank_offset: -1,
                            file_offset: 0
                        }];

                        var ignore_squares_black = [{
                            rank_offset: 0,
                            file_offset: 0
                        }, {
                            rank_offset: 0,
                            file_offset: -1
                        }, {
                            rank_offset: 0,
                            file_offset: 1
                        }, {
                            rank_offset: 1,
                            file_offset: 0
                        }];

                        if (src.piece.color == BLACK) {
                            probes = get_squares_around(square, ignore_squares_black);
                        } else {
                            probes = get_squares_around(square, ignore_squares_white);
                        }

                        moves = moves.concat(probes);
                        break;
                    case 3:
                        var probes = [];

                        var ignore_squares_white = [{
                            rank_offset: 0,
                            file_offset: 0
                        }, {
                            rank_offset: -1,
                            file_offset: -1
                        }, {
                            rank_offset: -1,
                            file_offset: 1
                        }];

                        var ignore_squares_black = [{
                            rank_offset: 0,
                            file_offset: 0
                        }, {
                            rank_offset: 1,
                            file_offset: -1
                        }, {
                            rank_offset: 1,
                            file_offset: 1
                        }];

                        if (src.piece.color == BLACK) {
                            probes = get_squares_around(square, ignore_squares_black);
                        } else {
                            probes = get_squares_around(square, ignore_squares_white);
                        }

                        moves = moves.concat(probes);
                        break;
                }
                break;
            case LIEUTENANT_GENERAL:
                switch (src.tier) {
                    case 1:
                        var probes = [];

                        var ignore_squares_white = [{
                            rank_offset: 0,
                            file_offset: 0
                        }, {
                            rank_offset: 0,
                            file_offset: -1
                        }, {
                            rank_offset: 0,
                            file_offset: 1
                        }, {
                            rank_offset: -1,
                            file_offset: 0
                        }];

                        var ignore_squares_black = [{
                            rank_offset: 0,
                            file_offset: 0
                        }, {
                            rank_offset: 0,
                            file_offset: -1
                        }, {
                            rank_offset: 0,
                            file_offset: 1
                        }, {
                            rank_offset: 1,
                            file_offset: 0
                        }];

                        if (src.piece.color == BLACK) {
                            probes = get_squares_around(square, ignore_squares_black);
                        } else {
                            probes = get_squares_around(square, ignore_squares_white);
                        }

                        moves = moves.concat(probes);
                        break;
                    case 2:
                        var probes = [];

                        var ignore_squares = [{
                            rank_offset: 0,
                            file_offset: 0
                        }, {
                            rank_offset: 0,
                            file_offset: -1
                        }, {
                            rank_offset: 0,
                            file_offset: 1
                        }];

                        probes = get_squares_around(square, ignore_squares);
                        moves = moves.concat(probes);
                        break;
                    case 3:
                        var probes = [];

                        var ignore_squares = [{
                            rank_offset: 0,
                            file_offset: 0
                        }];

                        probes = get_squares_around(square, ignore_squares);
                        moves = moves.concat(probes);
                        break;
                }
                break;
            case GENERAL:
                switch (src.tier) {
                    case 1:
                        var probes = [];

                        var ignore_squares_white = [{
                            rank_offset: 0,
                            file_offset: 0
                        }, {
                            rank_offset: -1,
                            file_offset: -1
                        }, {
                            rank_offset: -1,
                            file_offset: 1
                        }];

                        var ignore_squares_black = [{
                            rank_offset: 0,
                            file_offset: 0
                        }, {
                            rank_offset: 1,
                            file_offset: -1
                        }, {
                            rank_offset: 1,
                            file_offset: 1
                        }];

                        if (src.piece.color == BLACK) {
                            probes = get_squares_around(square, ignore_squares_black);
                        } else {
                            probes = get_squares_around(square, ignore_squares_white);
                        }

                        moves = moves.concat(probes);
                        break;
                    case 2:
                        var probes = [];

                        var ignore_squares = [{
                            rank_offset: 0,
                            file_offset: 0
                        }];

                        probes = get_squares_around(square, ignore_squares);
                        moves = moves.concat(probes);
                        break;
                    case 3:
                        var probes = [];

                        var ignore_squares = [{
                            rank_offset: 0,
                            file_offset: 0
                        }];

                        probes = get_squares_around(square, ignore_squares);

                        if (src.piece.color == BLACK) {
                            if (!isSquareOutOfBounds(rank - 2, file - 1) && get_top(rank - 1 + '-' + (file - 1))) {
                                probes.push({
                                    rank: rank - 2,
                                    file: file - 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank - 2, file) && get_top(rank - 1 + '-' + file)) {
                                probes.push({
                                    rank: rank - 2,
                                    file: file
                                });
                            }
                            if (!isSquareOutOfBounds(rank - 2, file + 1) && get_top(rank - 1 + '-' + (file + 1))) {
                                probes.push({
                                    rank: rank - 2,
                                    file: file + 1
                                });
                            }
                        } else {
                            if (!isSquareOutOfBounds(rank + 2, file - 1) && get_top(rank + 1 + '-' + (file - 1))) {
                                probes.push({
                                    rank: rank + 2,
                                    file: file - 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 2, file) && get_top(rank + 1 + '-' + file)) {
                                probes.push({
                                    rank: rank + 2,
                                    file: file
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 2, file + 1) && get_top(rank + 1 + '-' + (file + 1))) {
                                probes.push({
                                    rank: rank + 2,
                                    file: file + 1
                                });
                            }
                        }

                        moves = moves.concat(probes);
                        break;
                }
                break;
            case ARCHER:
                switch (src.tier) {
                    case 1:
                        var probes = [];

                        var ignore_squares = [{
                            rank_offset: 0,
                            file_offset: 0
                        }];

                        probes = get_squares_around(square, ignore_squares);
                        moves = moves.concat(probes);
                        break;
                    case 2:
                        var probes = [];

                        for (var i = 0; i < 4; i++) { 
                            if (!isSquareOutOfBounds(rank - 2, file + 2 - i)) {
                                probes.push({
                                    rank: rank - 2,
                                    file: file + 2 - i
                                });
                            }
                            if (!isSquareOutOfBounds(rank - 2 + i, file - 2)) {
                                probes.push({
                                    rank: rank - 2 + i,
                                    file: file - 2
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 2, file - 2 + i)) {
                                probes.push({
                                    rank: rank + 2,
                                    file: file - 2 + i
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 2 - i, file + 2)) {
                                probes.push({
                                    rank: rank + 2 - i,
                                    file: file + 2
                                });
                            }
                        }

                        moves = moves.concat(probes);
                        break;
                    case 3:
                        var probes = [];

                        for (var i = 0; i < 6; i++) { 
                            if (!isSquareOutOfBounds(rank - 3, file + 3 - i)) {
                                probes.push({
                                    rank: rank - 3,
                                    file: file + 3 - i
                                });
                            }
                            if (!isSquareOutOfBounds(rank - 3 + i, file - 3)) {
                                probes.push({
                                    rank: rank - 3 + i,
                                    file: file - 3
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 3, file - 3 + i)) {
                                probes.push({
                                    rank: rank + 3,
                                    file: file - 3 + i
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 3 - i, file + 3)) {
                                probes.push({
                                    rank: rank + 3 - i,
                                    file: file + 3
                                });
                            }
                        }

                        moves = moves.concat(probes);
                        break;
                }
                break;
            case KNIGHT:
                switch (src.tier) {
                    case 1:
                        var probes = [];

                        if (src.piece.color == BLACK) {
                            if (!isSquareOutOfBounds(rank, file - 1)) {
                                probes.push({
                                    rank: rank,
                                    file: file - 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank, file + 1)) {
                                probes.push({
                                    rank: rank,
                                    file: file + 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank - 2, file - 1)) {
                                probes.push({
                                    rank: rank - 2,
                                    file: file - 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank - 2, file + 1)) {
                                probes.push({
                                    rank: rank - 2,
                                    file: file + 1
                                });
                            }
                        } else {
                            if (!isSquareOutOfBounds(rank, file - 1)) {
                                probes.push({
                                    rank: rank,
                                    file: file - 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank, file + 1)) {
                                probes.push({
                                    rank: rank,
                                    file: file + 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 2, file - 1)) {
                                probes.push({
                                    rank: rank + 2,
                                    file: file - 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 2, file + 1)) {
                                probes.push({
                                    rank: rank + 2,
                                    file: file + 1
                                });
                            }
                        }

                        moves = moves.concat(probes);
                        break;
                    case 2:
                        var probes = [];

                        if (src.piece.color == BLACK) {
                            if (!isSquareOutOfBounds(rank - 1, file - 2)) {
                                probes.push({
                                    rank: rank - 1,
                                    file: file - 2
                                });
                            }
                            if (!isSquareOutOfBounds(rank - 2, file - 1)) {
                                probes.push({
                                    rank: rank - 2,
                                    file: file - 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank - 2, file + 1)) {
                                probes.push({
                                    rank: rank - 2,
                                    file: file + 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank - 1, file + 2)) {
                                probes.push({
                                    rank: rank - 1,
                                    file: file + 2
                                });
                            }
                        } else {
                            if (!isSquareOutOfBounds(rank + 1, file - 2)) {
                                probes.push({
                                    rank: rank + 1,
                                    file: file - 2
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 2, file - 1)) {
                                probes.push({
                                    rank: rank + 2,
                                    file: file - 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 2, file + 1)) {
                                probes.push({
                                    rank: rank + 2,
                                    file: file + 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 1, file + 2)) {
                                probes.push({
                                    rank: rank + 1,
                                    file: file + 2
                                });
                            }
                        }

                        moves = moves.concat(probes);
                        break;
                    case 3:
                        var probes = [];

                        if (!isSquareOutOfBounds(rank - 1, file - 2)) {
                            probes.push({
                                rank: rank - 1,
                                file: file - 2
                            });
                        }
                        if (!isSquareOutOfBounds(rank - 2, file - 1)) {
                            probes.push({
                                rank: rank - 2,
                                file: file - 1
                            });
                        }
                        if (!isSquareOutOfBounds(rank - 2, file + 1)) {
                            probes.push({
                                rank: rank - 2,
                                file: file + 1
                            });
                        }
                        if (!isSquareOutOfBounds(rank - 1, file + 2)) {
                            probes.push({
                                rank: rank - 1,
                                file: file + 2
                            });
                        }

                        if (!isSquareOutOfBounds(rank + 1, file - 2)) {
                            probes.push({
                                rank: rank + 1,
                                file: file - 2
                            });
                        }
                        if (!isSquareOutOfBounds(rank + 2, file - 1)) {
                            probes.push({
                                rank: rank + 2,
                                file: file - 1
                            });
                        }
                        if (!isSquareOutOfBounds(rank + 2, file + 1)) {
                            probes.push({
                                rank: rank + 2,
                                file: file + 1
                            });
                        }
                        if (!isSquareOutOfBounds(rank + 1, file + 2)) {
                            probes.push({
                                rank: rank + 1,
                                file: file + 2
                            });
                        }

                        moves = moves.concat(probes);
                        break;
                }
                break;
            case MUSKETEER:
                switch (src.tier) {
                    case 1:
                        var probes = [];

                        if (src.piece.color == BLACK) {
                            if (!isSquareOutOfBounds(rank - 1, file)) {
                                probes.push({
                                    rank: rank - 1,
                                    file: file
                                });
                            }
                        } else {
                            if (!isSquareOutOfBounds(rank + 1, file)) {
                                probes.push({
                                    rank: rank + 1,
                                    file: file
                                });
                            }
                        }

                        moves = moves.concat(probes);
                        break;
                    case 2:
                        if (src.piece.color == BLACK) {
                            var probes = probe_directions(square, 2, [false, false, false, true, false, false, false, false]);
                            moves = moves.concat(probes);
                        } else {
                            var probes = probe_directions(square, 2, [false, false, true, false, false, false, false, false]);
                            moves = moves.concat(probes);
                        }
                        break;
                    case 3:
                        if (src.piece.color == BLACK) {
                            var probes = probe_directions(square, 8, [false, false, false, true, false, false, false, false]);
                            moves = moves.concat(probes);
                        } else {
                            var probes = probe_directions(square, 8, [false, false, true, false, false, false, false, false]);
                            moves = moves.concat(probes);
                        }
                        break;
                }
                break;
            case CAPTAIN:
                switch (src.tier) {
                    case 1:
                        var probes = [];

                        var ignore_squares = [{
                            rank_offset: 0,
                            file_offset: 0
                        }];

                        probes = get_squares_around(square, ignore_squares);
                        moves = moves.concat(probes);
                        break;
                    case 2:
                    case 3:
                        var piece_under = get(square)[src.tier - 2];
                        moves = moves.concat(single_sqaure_move_gen({piece: {type: piece_under.type, color: piece_under.color}, tier: src.tier}, square));
                        break;
                }
                break;
            case SAMURAI:
                switch (src.tier) {
                    case 1:
                        var probes = [];

                        if (!isSquareOutOfBounds(rank + 1, file - 1)) {
                            probes.push({
                                rank: rank + 1,
                                file: file - 1
                            });
                        }
                        if (!isSquareOutOfBounds(rank + 1, file + 1)) {
                            probes.push({
                                rank: rank + 1,
                                file: file + 1
                            });
                        }
                        if (!isSquareOutOfBounds(rank - 1, file - 1)) {
                            probes.push({
                                rank: rank - 1,
                                file: file - 1
                            });
                        }
                        if (!isSquareOutOfBounds(rank - 1, file + 1)) {
                            probes.push({
                                rank: rank - 1,
                                file: file + 1
                            });
                        }

                        moves = moves.concat(probes);
                        break;
                    case 2:
                        var probes = [];

                        if (!isSquareOutOfBounds(rank + 2, file - 2)) {
                            probes.push({
                                rank: rank + 2,
                                file: file - 2
                            });
                        }
                        if (!isSquareOutOfBounds(rank + 2, file + 2)) {
                            probes.push({
                                rank: rank + 2,
                                file: file + 2
                            });
                        }
                        if (!isSquareOutOfBounds(rank - 2, file - 2)) {
                            probes.push({
                                rank: rank - 2,
                                file: file - 2
                            });
                        }
                        if (!isSquareOutOfBounds(rank - 2, file + 2)) {
                            probes.push({
                                rank: rank - 2,
                                file: file + 2
                            });
                        }

                        moves = moves.concat(probes);
                        break;
                    case 3:
                        var probes = probe_directions(square, 8, [false, false, false, false, true, true, true, true]);

                        moves = moves.concat(probes);
                        break;
                }
                break;
            case FORTRESS:
                var probes = [];

                var ignore_squares = [{
                    rank_offset: 0,
                    file_offset: 0
                }];

                probes = get_squares_around(square, ignore_squares);
                moves = moves.concat(probes);
                break;
            case CANNON:
                switch (src.tier) {
                    case 1:
                        var probes = [];

                        if (!isSquareOutOfBounds(rank, file - 1)) {
                            probes.push({
                                rank: rank,
                                file: file - 1
                            });
                        }
                        if (!isSquareOutOfBounds(rank, file + 1)) {
                            probes.push({
                                rank: rank,
                                file: file + 1
                            });
                        }
                        if (!isSquareOutOfBounds(rank - 1, file)) {
                            probes.push({
                                rank: rank - 1,
                                file: file
                            });
                        }
                        if (!isSquareOutOfBounds(rank + 1, file)) {
                            probes.push({
                                rank: rank + 1,
                                file: file
                            });
                        }

                        moves = moves.concat(probes);
                        break;
                    case 2:
                        var probes = probe_directions(square, 2, [true, true, true, true, false, false, false, false]);

                        moves = moves.concat(probes);
                        break;
                    case 3:
                        var probes = probe_directions(square, 8, [true, true, true, true, false, false, false, false]);

                        moves = moves.concat(probes);
                        break;
                }
                break;
            case SPY:
                switch (src.tier) {
                    case 1:
                        var probes = [];

                        if (src.piece.color == BLACK) {
                            if (!isSquareOutOfBounds(rank - 1, file)) {
                                probes.push({
                                    rank: rank - 1,
                                    file: file
                                });
                            }
                        } else {
                            if (!isSquareOutOfBounds(rank + 1, file)) {
                                probes.push({
                                    rank: rank + 1,
                                    file: file
                                });
                            }
                        }

                        moves = moves.concat(probes);
                        break;
                    case 2:
                        var probes = [];

                        if (!isSquareOutOfBounds(rank + 1, file - 1)) {
                            probes.push({
                                rank: rank + 1,
                                file: file - 1
                            });
                        }
                        if (!isSquareOutOfBounds(rank + 1, file + 1)) {
                            probes.push({
                                rank: rank + 1,
                                file: file + 1
                            });
                        }
                        if (!isSquareOutOfBounds(rank - 1, file - 1)) {
                            probes.push({
                                rank: rank - 1,
                                file: file - 1
                            });
                        }
                        if (!isSquareOutOfBounds(rank - 1, file + 1)) {
                            probes.push({
                                rank: rank - 1,
                                file: file + 1
                            });
                        }

                        moves = moves.concat(probes);
                        break;
                    case 3:
                        var probes = probe_directions(square, 8, [true, true, true, true, true, true, true, true]);

                        moves = moves.concat(probes);
                        break;
                }
                break;
            case PAWN:
                switch (src.tier) {
                    case 1:
                        var probes = [];

                        if (src.piece.color == BLACK) {
                            if (!isSquareOutOfBounds(rank - 1, file)) {
                                probes.push({
                                    rank: rank - 1,
                                    file: file
                                });
                            }
                        } else {
                            if (!isSquareOutOfBounds(rank + 1, file)) {
                                probes.push({
                                    rank: rank + 1,
                                    file: file
                                });
                            }
                        }

                        moves = moves.concat(probes);
                        break;
                    case 2:
                    case 3:
                        var probes = [];

                        if (src.piece.color == BLACK) {
                            if (!isSquareOutOfBounds(rank - 1, file)) {
                                probes.push({
                                    rank: rank - 1,
                                    file: file
                                });
                            }
                            if (!isSquareOutOfBounds(rank - 1, file - 1)) {
                                probes.push({
                                    rank: rank - 1,
                                    file: file - 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank - 1, file + 1)) {
                                probes.push({
                                    rank: rank - 1,
                                    file: file + 1
                                });
                            }
                        } else {
                            if (!isSquareOutOfBounds(rank + 1, file)) {
                                probes.push({
                                    rank: rank + 1,
                                    file: file
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 1, file - 1)) {
                                probes.push({
                                    rank: rank + 1,
                                    file: file - 1
                                });
                            }
                            if (!isSquareOutOfBounds(rank + 1, file + 1)) {
                                probes.push({
                                    rank: rank + 1,
                                    file: file + 1
                                });
                            }
                        }

                        moves = moves.concat(probes);
                        break;
                }
                break;
            case MARSHALL:
                switch (src.tier) {
                    case 1:
                    case 2:
                    case 3:
                        var probes = [];

                        var ignore_squares = [{
                            rank_offset: 0,
                            file_offset: 0
                        }];

                        probes = get_squares_around(square, ignore_squares);
                        moves = moves.concat(probes);
                        break;
                }
                break;
        }

        return moves;
    }

    stockpile_move_gen = () => {
        var moves = [];

        if (phase == DRAFT) {
            if (turn == BLACK) {
                if (marshall_placed.b == 0) { // first piece placed must be marshall
                    // add all valid squares in first 3 ranks
                    for (var i = RANK_7; i <= RANK_9; i++) {
                        for (var j = FILE_1; j <= FILE_9; j++) {
                            moves.push({
                                src: {
                                    type: MARSHALL,
                                    color: BLACK
                                },
                                dst: i + '-' + j,
                                type: PLACE
                            });
                        }
                    }
                } else { // after marshall placed
                    moves.push({
                        src: null,
                        dst: null,
                        type: READY
                    })

                    if (army_size.b == 26) { // maximum number of pieces at any time is 26
                        return moves;
                    }

                    var pieces = get_stockpile(BLACK).filter(x => x.amount > 0).map(x => x.piece);
                    pieces.forEach(piece => {
                        for (var i = RANK_7; i <= RANK_9; i++) {
                            for (var j = FILE_1; j <= FILE_9; j++) {
                                var dest = get_top(i + '-' + j);

                                if (piece.type == FORTRESS) {
                                    if (dest == null) { // fortress can't stack on other pieces
                                        moves.push({
                                            src: piece,
                                            dst: i + '-' + j,
                                            type: PLACE
                                        });
                                    }
                                } else {
                                    if (dest == null || (dest.tier < 3 && dest.piece.type != MARSHALL)) { // marhsall cannot be stacked on
                                        if (piece.type == PAWN) {
                                            var pawns_in_file = board.map(x => x[j - 1]).filter(x => x.some(item => item != null && item.color == BLACK && item.type == PAWN)).length;
                                            if (pawns_in_file == 0) { // multiple pawns can't be placed in the same file
                                                moves.push({
                                                    src: piece,
                                                    dst: i + '-' + j,
                                                    type: PLACE
                                                });
                                            }
                                        } else {
                                            moves.push({
                                                src: piece,
                                                dst: i + '-' + j,
                                                type: PLACE
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            } else { // white's turn
                if (marshall_placed.w == 0) { // first piece placed must be marshall
                    // add all valid squares in first 3 ranks
                    for (var i = RANK_1; i <= RANK_3; i++) {
                        for (var j = FILE_1; j <= FILE_9; j++) {
                            moves.push({
                                src: {
                                    type: MARSHALL,
                                    color: WHITE
                                },
                                dst: i + '-' + j,
                                type: PLACE
                            });
                        }
                    }
                } else { // after marshall placed
                    moves.push({
                        src: null,
                        dst: null,
                        type: READY
                    })

                    if (army_size.w == 26) { // maximum number of pieces at any time is 26
                        return moves;
                    }

                    var pieces = get_stockpile(WHITE).filter(x => x.amount > 0).map(x => x.piece);
                    pieces.forEach(piece => {
                        for (var i = RANK_1; i <= RANK_3; i++) {
                            for (var j = FILE_1; j <= FILE_9; j++) {
                                var dest = get_top(i + '-' + j);

                                if (piece.type == FORTRESS) {
                                    if (dest == null) { // fortress can't stack on other pieces
                                        moves.push({
                                            src: piece,
                                            dst: i + '-' + j,
                                            type: PLACE
                                        });
                                    }
                                } else {
                                    if (dest == null || (dest.tier < 3 && dest.piece.type != MARSHALL)) { // marhsall cannot be stacked on
                                        if (piece.type == PAWN) {
                                            var pawns_in_file = board.map(x => x[j - 1]).filter(x => x.some(item => item != null && item.color == WHITE && item.type == PAWN)).length;
                                            if (pawns_in_file == 0) { // multiple pawns can't be placed in the same file
                                                moves.push({
                                                    src: piece,
                                                    dst: i + '-' + j,
                                                    type: PLACE
                                                });
                                            }
                                        } else {
                                            moves.push({
                                                src: piece,
                                                dst: i + '-' + j,
                                                type: PLACE
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
            }
        } else { // game phase
            if (turn == BLACK) {
                if (army_size.b == 26) { // maximum number of pieces at any time is 26
                    return moves;
                }

                var pieces = get_stockpile(BLACK).filter(x => x.amount > 0).map(x => x.piece);
                    pieces.forEach(piece => {
                        for (var i = RANK_4; i <= RANK_9; i++) {
                            for (var j = FILE_1; j <= FILE_9; j++) {
                                var dest = get_top(i + '-' + j);

                                if (piece.type == FORTRESS) {
                                    if (dest == null) { // fortress can't stack on other pieces
                                        moves.push({
                                            src: piece,
                                            dst: i + '-' + j,
                                            type: PLACE
                                        });
                                    }
                                } else {
                                    if (dest == null || (dest.tier < 3 && dest.piece.type != MARSHALL)) { // marhsall cannot be stacked on
                                        if (piece.type == PAWN) {
                                            var pawns_in_file = board.map(x => x[j - 1]).filter(x => x.some(item => item != null && item.color == BLACK && item.type == PAWN)).length;
                                            if (pawns_in_file == 0) { // multiple pawns can't be placed in the same file
                                                moves.push({
                                                    src: piece,
                                                    dst: i + '-' + j,
                                                    type: PLACE
                                                });
                                            }
                                        } else {
                                            moves.push({
                                                src: piece,
                                                dst: i + '-' + j,
                                                type: PLACE
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    });
            } else { // white's turn
                if (army_size.w == 26) { // maximum number of pieces at any time is 26
                    return moves;
                }
                var pieces = get_stockpile(WHITE).filter(x => x.amount > 0).map(x => x.piece);
                    pieces.forEach(piece => {
                        for (var i = RANK_1; i <= RANK_6; i++) {
                            for (var j = FILE_1; j <= FILE_9; j++) {
                                var dest = get_top(i + '-' + j);

                                if (piece.type == FORTRESS) {
                                    if (dest == null) { // fortress can't stack on other pieces
                                        moves.push({
                                            src: piece,
                                            dst: i + '-' + j,
                                            type: PLACE
                                        });
                                    }
                                } else {
                                    if (dest == null || (dest.tier < 3 && dest.piece.type != MARSHALL)) { // marhsall cannot be stacked on
                                        if (piece.type == PAWN) {
                                            var pawns_in_file = board.map(x => x[j - 1]).filter(x => x.some(item => item != null && item.color == WHITE && item.type == PAWN)).length;
                                            if (pawns_in_file == 0) { // multiple pawns can't be placed in the same file
                                                moves.push({
                                                    src: piece,
                                                    dst: i + '-' + j,
                                                    type: PLACE
                                                });
                                            }
                                        } else {
                                            moves.push({
                                                src: piece,
                                                dst: i + '-' + j,
                                                type: PLACE
                                            });
                                        }
                                    }
                                }
                            }
                        }
                    });
            }
        }

        return moves;
    }

    moves = (options) => {
        var moves = [];
        
        if (phase == GAME) {
            for (var i = RANK_1; i <= RANK_9; i++) {
                for (var j = FILE_1; j <= FILE_9; j++) {
                    var square = i + '-' + j;
                    var src = get_top(square);
                    if (src != null && src.piece.color == turn) {
                        var probes = single_sqaure_move_gen(src, square);
                        moves = moves.concat(generate_moves_from_probes(probes, src, square));
                    }
                }
            }
        }

        moves = moves.concat(stockpile_move_gen());

        var temp_board = JSON.stringify(board);
        for (var i = moves.length - 1; i >= 0; i--) {
            var move = moves[i];
            
            switch (move.type) {
                case MOVEMENT:
                    var piece = remove(move.src);
                    put(piece, move.dst);
                    break;
                case PLACE:
                    put({
                        type: move.src.type,
                        color: move.src.color
                    }, move.dst);
                    break;
                case ATTACK:
                    var piece = remove(move.dst);
    
                    if (get_top(move.dst) == null) {
                        var temp = remove(move.src);
                        put(temp, move.dst);
                    }
                    break;
                case STACK:
                    var piece = remove(move.src);
                    put(piece, move.dst);
                    break;
                default:
                    break;
            }

            // pawns can't place opponent into mate
            if (move.src != null && move.src.type == PAWN) {
                if (turn == BLACK) {
                    turn = WHITE;
                } else {
                    turn = BLACK;
                }

                if (in_checkmate()) {
                    moves.splice(i, 1);
                }

                if (turn == BLACK) {
                    turn = WHITE;
                } else {
                    turn = BLACK;
                }
            }

            if (in_check()) {
                moves.splice(i, 1);
            }
            
            board = JSON.parse(temp_board);
        }

        if (options != null && options.square != null) {
            var input = options.square.split("-");
            var rank = parseInt(input[0]);
            var file = parseInt(input[1]);

            if (!isSquareOutOfBounds(rank, file)) {
                return moves.filter(x => x.src != null && x.src == options.square && x.type != PLACE && x.type != READY);
            }
        }

        if (options != null && options.stock_piece != null) {
            return moves.filter(x => x.src != null && x.src.type === options.stock_piece && x.type == PLACE);
        }

        return moves;
    }

    move = (player_move) => {
        var legal_moves = moves().filter(x => JSON.stringify(x) === JSON.stringify(player_move));
        if (legal_moves.length) {
            var legal_move = legal_moves[0];
            var source_piece = typeof legal_move.src === 'string' ? get_top(legal_move.src) : null;
            var destination_piece = null;

            if (typeof legal_move.dst === 'string'){
                destination_piece = get_top(legal_move.dst);
                if (destination_piece == null) {
                    destination_piece = {piece: null, tier: 1}
                }
            }

            switch (legal_move.type) {
                case MOVEMENT:
                    var piece = remove(legal_move.src);
                    put(piece, legal_move.dst);
                    break;
                case PLACE:
                    remove_stockpile(legal_move.src);
                    
                    put({
                        type: legal_move.src.type,
                        color: legal_move.src.color
                    }, legal_move.dst);
    
                    if (legal_move.src.color == BLACK) {
                        army_size.b++;
                        if (legal_move.src.type == MARSHALL) {
                            marshall_placed.b = 1;
                        }
                    } else {
                        army_size.w++;
                        if (legal_move.src.type == MARSHALL) {
                            marshall_placed.w = 1;
                        }
                    }
                    break;
                case ATTACK:
                    var piece = remove(legal_move.dst);
    
                    var c = captured.filter(x => JSON.stringify(x.piece) === JSON.stringify(piece));
                    if (c.length > 0) {
                        c[0].amount++;
                    } else {
                        captured.push({piece: piece, amount: 1});
                    }
    
                    if (get_top(legal_move.dst) == null) {
                        var temp = remove(legal_move.src);
                        put(temp, legal_move.dst);
                    }
                    break;
                case STACK:
                    var piece = remove(legal_move.src);
                    put(piece, legal_move.dst);
                    break;
                case READY:
                    if (turn == BLACK) {
                        drafted.b = 1;
                    } else {
                        drafted.w = 1;
                    }

                    if (drafted.w ^ drafted.b) {
                        half_moves++;
                    }
                    if (drafted.w == 1 &&  drafted.b == 1) {
                        half_moves--;
                    }
                    break;
            }

            if (drafted.w == drafted.b || (history.length > 0  && history[history.length-1].type == 'ready')) {
                half_moves++;
            }

            history.push({
                turn: turn,
                half_move_number: half_moves,
                move: legal_move,
                from: source_piece,
                to: destination_piece,
                type: legal_move.type
            });

            if (phase == DRAFT) {
                if (drafted.w == 0 && drafted.b == 0) {
                    if (turn == BLACK) {
                        turn = WHITE;
                    } else {
                        turn = BLACK;
                    }
                } else if (drafted.w == 1 && drafted.b == 0) {
                    turn = BLACK;
                } else if (drafted.w == 0 && drafted.b == 1) {
                    turn = WHITE;
                } else if (drafted.w == 1 && drafted.b == 1) {
                    turn = WHITE;
                    phase = GAME;
                }
            } else { // Game phase
                if (turn == BLACK) {
                    turn = WHITE;
                } else {
                    turn = BLACK;
                }
            }

            return legal_move;
        }
        return null;
    }

    ascii = () => {
        var s = '     +--------------------------------------------------------+\n';
        s += '     |                                                        |\n';
        for (var i = 9; i > 0; i--) {
            s += ` ｒ${i} |  `;

            for (var j = 1; j < 10; j++) {
                var top = get_top(i + '-' + j);
                if (top !== null) {

                    var type = top.piece.type;
                    var color = top.piece.color;
                    var symbol;

                    switch (top.tier) {
                        case 1:
                            symbol = color === WHITE ? TIER1_WHITE : TIER1_BLACK;
                            break;
                        case 2:
                            symbol = color === WHITE ? TIER2_WHITE : TIER2_BLACK;
                            break;
                        case 3:
                            symbol = color === WHITE ? TIER3_WHITE : TIER3_BLACK;
                            break;
                    }


                    s += `${symbol + type}  `;
                } else {
                    s += '。。  ';
                }
            }
            s += '|\n';
            s += '     |                                                        |\n';
        }
        s += '     +--------------------------------------------------------+\n';
        s += '        ｆ１  ｆ２  ｆ３  ｆ４  ｆ５  ｆ６  ｆ７  ｆ８  ｆ９';
        return s;
    }

    return {
        /***************************************************************************
         * PUBLIC CONSTANTS
         **************************************************************************/
        WHITE: WHITE,
        BLACK: BLACK,

        ATTACK: ATTACK,
        STACK: STACK,
        MOVEMENT: MOVEMENT,
        PLACE: PLACE,
        READY: READY,

        MAJOR_GENERAL: MAJOR_GENERAL,
        LIEUTENANT_GENERAL: LIEUTENANT_GENERAL,
        GENERAL: GENERAL,
        ARCHER: ARCHER,
        KNIGHT: KNIGHT,
        MUSKETEER: MUSKETEER,
        CAPTAIN: CAPTAIN,
        SAMURAI: SAMURAI,
        FORTRESS: FORTRESS,
        CANNON: CANNON,
        SPY: SPY,
        PAWN: PAWN,
        MARSHALL: MARSHALL,

        /***************************************************************************
         * PUBLIC API
         **************************************************************************/
        ascii: function () {
            return ascii()
        },
        get: function (square) {
            return get(square);
        },
        get_top: function (square) {
            return get_top(square);
        },
        stockpile: function (color) {
            return get_stockpile(color);
        },
        board: function () {
            return board;
        },
        history: function () {
            return history;
        },
        turn: function () {
            return turn;
        },
        phase: function () {
            return phase;
        },
        captured: function (color) {
            return get_captured(color);
        },
        game_over: function () {
            return game_over();
        },
        pgn: function () {
            return pgn();
        },
        in_checkmate: function () {
            return in_checkmate();
        },
        in_check: function () {
            return in_check();
        },
        in_stalemate: function () {
            return in_stalemate();
        },
        moves: function (options) {
            return moves(options);
        },
        move: function (player_move) {
            return move(player_move);
        },
    }
}

if (typeof exports !== 'undefined') exports.Gungi = Gungi;
/* export Gungi object for any RequireJS compatible environment */
if (typeof define !== 'undefined')
    define(function () {
        return Gungi;
    })