// Forsyth–Edwards Notation (FEN) Parser and Serializer for Gungi games.
// Read more about FEN for chess: https://en.wikipedia.org/wiki/Forsyth%E2%80%93Edwards_Notation
//
// Gungi FEN will have
// 1. Piece placement data:
//    Each rank is described, starting with rank 1 and ending with rank 9, with a '/' between each one; within each rank,
//    the contents of the squares are described from file 9 to file 1; within each square the tower is described
//    from bottom to top (towers of 2 or higher are surrounded with a '|').
//    Each pieces is represented by a single character from the standard English names
//
//    帥 marshal = m
//    大 general = g
//    中 lieutenant_general = i
//    小 major_general = j
//    侍 warrior = w
//    槍 lancer = n
//    馬 rider = r
//    忍 spy = s
//    砦 fortress = f
//    兵 soldier = d
//    砲 cannon = c
//    弓 archer = a
//    筒 musketeer = k
//    謀 tactician = t
//
//    Black pieces are designated using lowercase ("mgljwcrsfdnakt"),
//    while white pieces use uppercase ("MGLJWCRSFDNAKT")
//
//    A set of one or more consecutive empty squares within a rank is denoted by a digit from "1" to "9", corresponding to the number of squares.
// 2: Active player:
//    "w" means that White is to move; "b" means that Black is to move.
// 3: Setup mode:
//    "0" means intro placement, "1" for Beginner, "2" for Intermediate, "3" for Advanced
// 4: Drafting:
//    "0" means no longer drafting, "1" means in drafting stage
// 5: Full move number:
//    The number of the full moves. It starts at 1 and is incremented after Black's move.
//
// Examples
//
// FEN for the starting position of a beginner game of gungi:
// "3img3/1ra1n1as1/d1fwdwf1d/9/9/9/D1FWDWF1D/1SA1N1AR1/3GMI3 w 1 0 1
// and after the move 1.
