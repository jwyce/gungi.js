import { parseFEN, ParsedFEN, encodeFEN } from './fen';
import { Board, HandPiece, Piece, Color, PieceType } from './utils';

export type PieceInventory = {
	[key: string]: {
		boardPieces: Piece[];
		handPieces: HandPiece[];
	};
};

export type MoveChange = {
	isSingleMove: boolean;
	movedPiece?: {
		fromSquare?: string;
		toSquare: string;
		piece: Piece;
		isArata: boolean;
		isCapture: boolean;
	};
	capturedPieces?: Piece[];
};

/**
 * Main entry point for assigning piece IDs
 * Uses canonical assignment for base case, move-aware assignment for stability
 */
export function assignPieceIds(currentFen: string, previousFen?: string): ParsedFEN {
	const currentState = parseFEN(currentFen);
	
	if (!previousFen) {
		// Base case: pure canonical assignment
		return assignCanonically(currentState);
	}
	
	// Detect what changed between the FENs
	const changes = detectMoveBetween(previousFen, currentFen);
	
	if (changes.isSingleMove && changes.movedPiece) {
		// Preserve the moving piece's ID
		// IMPORTANT: Parse previous FEN directly, don't recurse to avoid corruption
		const previousState = parseFEN(previousFen);
		return preserveMovingPieceId(currentState, previousState, changes);
	} else {
		// Fall back to canonical for complex changes
		return assignCanonically(currentState);
	}
}

/**
 * Main entry point for assigning piece IDs with previous state
 * Uses previous parsed state with IDs for better stability
 */
export function assignPieceIdsWithState(currentFen: string, previousState?: ParsedFEN | null): ParsedFEN {
	const currentState = parseFEN(currentFen);
	
	if (!previousState) {
		// Base case: pure canonical assignment
		return assignCanonically(currentState);
	}
	
	// Get the previous FEN to detect changes
	const previousFen = encodeFEN({
		board: previousState.board,
		hand: previousState.hand,
		turn: previousState.turn,
		moveNumber: previousState.moveNumber,
		drafting: previousState.drafting,
		mode: previousState.mode
	});
	
	// Detect what changed between the FENs
	const changes = detectMoveBetween(previousFen, currentFen);
	
	if (changes.isSingleMove && changes.movedPiece) {
		// Preserve the moving piece's ID using the state with IDs
		return preserveMovingPieceId(currentState, previousState, changes);
	} else {
		// Fall back to canonical for complex changes
		return assignCanonically(currentState);
	}
}

/**
 * Assigns IDs based purely on canonical positioning
 * Deterministic: same game state always produces same IDs
 */
function assignCanonically(state: ParsedFEN): ParsedFEN {
	// Clone the state to avoid mutations
	const result: ParsedFEN = {
		...state,
		board: state.board.map(rank => 
			rank.map(file => 
				file.map(piece => piece ? { ...piece } : piece)
			)
		),
		hand: state.hand.map(hp => ({ ...hp }))
	};
	
	// Get inventory of all pieces by type and color
	const inventory = getPieceInventory(result.board, result.hand);
	
	// Assign IDs to each piece type/color group
	for (const key in inventory) {
		const group = inventory[key];
		const [color, pieceType] = key.split('-') as [Color, PieceType];
		
		// Sort pieces canonically: board pieces first, then hand pieces
		const allPieces = [
			...group.boardPieces.sort(comparePiecesCanonically),
			...group.handPieces
		];
		
		// Assign sequential IDs
		allPieces.forEach((piece, index) => {
			piece.id = `${color}-${pieceType}-${index + 1}`;
		});
	}
	
	return result;
}

/**
 * Detects changes between two FEN strings
 * Returns information about what moved for stability purposes
 */
function detectMoveBetween(oldFen: string, newFen: string): MoveChange {
	const oldState = parseFEN(oldFen);
	const newState = parseFEN(newFen);
	
	// Compare board states
	const boardChanges = detectBoardChanges(oldState.board, newState.board);
	const handChanges = detectHandChanges(oldState.hand, newState.hand);
	
	// Check if this looks like a single move
	const totalChanges = boardChanges.disappeared.length + boardChanges.appeared.length;
	const handPieceChanges = Math.abs(handChanges.whiteChange) + Math.abs(handChanges.blackChange);
	
	// Simple single move: one piece disappeared, one appeared, minimal hand changes
	if (totalChanges === 2 && handPieceChanges <= 1) {
		const disappeared = boardChanges.disappeared[0];
		const appeared = boardChanges.appeared[0];
		
		// Check if same piece type and color
		if (disappeared && appeared && 
		    disappeared.type === appeared.type && 
		    disappeared.color === appeared.color) {
			
			return {
				isSingleMove: true,
				movedPiece: {
					fromSquare: disappeared.square,
					toSquare: appeared.square,
					piece: appeared,
					isArata: false,
					isCapture: false
				}
			};
		}
	}
	
	// Check for arata move (hand to board)
	if (boardChanges.appeared.length === 1 && boardChanges.disappeared.length === 0) {
		const appeared = boardChanges.appeared[0];
		const handChange = handChanges.changes.find(change => 
			change.type === appeared.type && 
			change.color === appeared.color && 
			change.countDiff < 0
		);
		
		if (handChange) {
			return {
				isSingleMove: true,
				movedPiece: {
					toSquare: appeared.square,
					piece: appeared,
					isArata: true,
					isCapture: false
				}
			};
		}
	}
	
	// Check for capture move (one piece moved, one disappeared)
	if (boardChanges.appeared.length === 1 && boardChanges.disappeared.length === 2) {
		const appeared = boardChanges.appeared[0];
		const possibleMover = boardChanges.disappeared.find(p => 
			p.type === appeared.type && p.color === appeared.color
		);
		const possibleCaptured = boardChanges.disappeared.find(p => 
			p.type !== appeared.type || p.color !== appeared.color
		);
		
		if (possibleMover && possibleCaptured) {
			return {
				isSingleMove: true,
				movedPiece: {
					fromSquare: possibleMover.square,
					toSquare: appeared.square,
					piece: appeared,
					isArata: false,
					isCapture: true
				},
				capturedPieces: [possibleCaptured]
			};
		}
	}
	
	return { isSingleMove: false };
}

/**
 * Compare board states to find what pieces appeared/disappeared
 */
function detectBoardChanges(oldBoard: Board, newBoard: Board) {
	const disappeared: Piece[] = [];
	const appeared: Piece[] = [];
	
	// Create maps of pieces by position for easy comparison
	const oldPieces = new Map<string, Piece[]>();
	const newPieces = new Map<string, Piece[]>();
	
	// Build old pieces map
	for (const rank of oldBoard) {
		for (const file of rank) {
			for (const piece of file) {
				if (piece) {
					if (!oldPieces.has(piece.square)) {
						oldPieces.set(piece.square, []);
					}
					oldPieces.get(piece.square)!.push(piece);
				}
			}
		}
	}
	
	// Build new pieces map
	for (const rank of newBoard) {
		for (const file of rank) {
			for (const piece of file) {
				if (piece) {
					if (!newPieces.has(piece.square)) {
						newPieces.set(piece.square, []);
					}
					newPieces.get(piece.square)!.push(piece);
				}
			}
		}
	}
	
	// Find disappeared pieces
	for (const [square, pieces] of oldPieces) {
		const newSquarePieces = newPieces.get(square) || [];
		for (const oldPiece of pieces) {
			// Check if this exact piece (type, color, tier) still exists at this position
			const stillExists = newSquarePieces.some(newPiece => 
				newPiece.type === oldPiece.type && 
				newPiece.color === oldPiece.color && 
				newPiece.tier === oldPiece.tier
			);
			if (!stillExists) {
				disappeared.push(oldPiece);
			}
		}
	}
	
	// Find appeared pieces
	for (const [square, pieces] of newPieces) {
		const oldSquarePieces = oldPieces.get(square) || [];
		for (const newPiece of pieces) {
			// Check if this exact piece (type, color, tier) was already at this position
			const wasAlreadyThere = oldSquarePieces.some(oldPiece => 
				oldPiece.type === newPiece.type && 
				oldPiece.color === newPiece.color && 
				oldPiece.tier === newPiece.tier
			);
			if (!wasAlreadyThere) {
				appeared.push(newPiece);
			}
		}
	}
	
	return { disappeared, appeared };
}

/**
 * Compare hand states to find what changed
 */
function detectHandChanges(oldHand: HandPiece[], newHand: HandPiece[]) {
	const oldMap = new Map<string, number>();
	const newMap = new Map<string, number>();
	
	// Build maps of piece counts
	for (const hp of oldHand) {
		const key = `${hp.color}-${hp.type}`;
		oldMap.set(key, hp.count);
	}
	
	for (const hp of newHand) {
		const key = `${hp.color}-${hp.type}`;
		newMap.set(key, hp.count);
	}
	
	// Calculate changes
	const changes: Array<{type: PieceType, color: Color, countDiff: number}> = [];
	let whiteChange = 0;
	let blackChange = 0;
	
	// Find all unique keys
	const allKeys = new Set([...oldMap.keys(), ...newMap.keys()]);
	
	for (const key of allKeys) {
		const oldCount = oldMap.get(key) || 0;
		const newCount = newMap.get(key) || 0;
		const diff = newCount - oldCount;
		
		if (diff !== 0) {
			const [color, type] = key.split('-') as [Color, PieceType];
			changes.push({ type, color, countDiff: diff });
			
			if (color === 'w') {
				whiteChange += Math.abs(diff);
			} else {
				blackChange += Math.abs(diff);
			}
		}
	}
	
	return { changes, whiteChange, blackChange };
}

/**
 * Preserves the moving piece's ID when a single move is detected
 */
function preserveMovingPieceId(
	currentState: ParsedFEN,
	previousState: ParsedFEN,
	changes: MoveChange
): ParsedFEN {
	// Clone the current state without any IDs initially 
	const result: ParsedFEN = {
		...currentState,
		board: currentState.board.map(rank => 
			rank.map(file => 
				file.map(piece => piece ? { ...piece, id: undefined } : piece)
			)
		),
		hand: currentState.hand.map(hp => ({ ...hp, id: undefined }))
	};
	
	if (!changes.movedPiece) return result;
	
	// First, preserve ALL non-moving pieces by copying their IDs from previous state
	preserveAllNonMovingPieceIds(result, previousState, changes);
	
	// Then apply canonical assignment ONLY to pieces that don't already have IDs
	applyCanonicalToMissingIds(result);
	
	const { fromSquare, toSquare, piece, isArata } = changes.movedPiece;
	
	if (isArata) {
		// Arata move (hand to board): find the hand piece that moved and preserve its ID
		const previousHandPiece = previousState.hand.find(hp => 
			hp.type === piece.type && hp.color === piece.color
		);
		
		if (previousHandPiece?.id) {
			// Find the new board piece at the target square and give it the hand piece's ID
			const boardPiece = findPieceAtSquare(result.board, toSquare, piece.type, piece.color, piece.tier);
			if (boardPiece) {
				boardPiece.id = previousHandPiece.id;
			}
			
			// Update the hand piece count but keep its base ID structure
			const newHandPiece = result.hand.find(hp => 
				hp.type === piece.type && hp.color === piece.color
			);
			if (newHandPiece && previousHandPiece.id) {
				// Keep the same base ID for the remaining hand pieces
				newHandPiece.id = previousHandPiece.id;
			}
		}
	} else {
		// Regular move (board to board): preserve the piece's ID
		const previousPiece = fromSquare ? 
			findPieceAtSquare(previousState.board, fromSquare, piece.type, piece.color) : null;
		
		if (previousPiece?.id) {
			// Find the piece at the new location and assign the same ID
			const newPiece = findPieceAtSquare(result.board, toSquare, piece.type, piece.color, piece.tier);
			if (newPiece) {
				newPiece.id = previousPiece.id;
			}
		}
	}
	
	return result;
}

/**
 * Find a piece at a specific square with optional type/color/tier filters
 */
function findPieceAtSquare(
	board: Board, 
	square: string, 
	type?: PieceType, 
	color?: Color, 
	tier?: number
): Piece | null {
	const [rank, file] = square.split('-').map(Number);
	if (rank < 1 || rank > 9 || file < 1 || file > 9) return null;
	
	const tower = board[rank - 1][9 - file];
	for (const piece of tower) {
		if (piece && 
		    (!type || piece.type === type) && 
		    (!color || piece.color === color) &&
		    (!tier || piece.tier === tier)) {
			return piece;
		}
	}
	return null;
}

/**
 * Preserve IDs for ALL pieces that didn't move using ID-based matching
 */
function preserveAllNonMovingPieceIds(
	currentState: ParsedFEN,
	previousState: ParsedFEN,
	changes: MoveChange
): void {
	if (!changes.movedPiece) return;
	
	const { fromSquare, toSquare, piece: movedPiece, isArata } = changes.movedPiece;
	
	// For each piece type/color group, preserve IDs for non-moving pieces
	const previousInventory = getPieceInventory(previousState.board, previousState.hand);
	const currentInventory = getPieceInventory(currentState.board, currentState.hand);
	
	for (const typeColorKey in previousInventory) {
		const prevGroup = previousInventory[typeColorKey];
		const currentGroup = currentInventory[typeColorKey];
		
		if (!currentGroup) continue; // No pieces of this type in current state
		
		const [color, pieceType] = typeColorKey.split('-') as [Color, PieceType];
		
		// Check if this is the type that moved
		const isMovedType = movedPiece.type === pieceType && movedPiece.color === color;
		
		if (isMovedType) {
			// For the moved piece type, we need to carefully preserve non-moving pieces
			preserveNonMovingPiecesOfType(
				currentGroup,
				prevGroup,
				fromSquare,
				toSquare,
				isArata
			);
		} else {
			// For non-moved types, preserve all IDs by canonical position
			preserveAllPiecesOfType(currentGroup, prevGroup);
		}
	}
}

/**
 * Preserve IDs for all pieces of a type that didn't move at all
 */
function preserveAllPiecesOfType(
	currentGroup: { boardPieces: Piece[], handPieces: HandPiece[] },
	prevGroup: { boardPieces: Piece[], handPieces: HandPiece[] }
): void {
	// For board pieces, match by exact position and tier
	for (const currentPiece of currentGroup.boardPieces) {
		const prevAtSamePos = prevGroup.boardPieces.find(prev => 
			prev.square === currentPiece.square && 
			prev.tier === currentPiece.tier
		);
		
		if (prevAtSamePos?.id) {
			currentPiece.id = prevAtSamePos.id;
		}
	}
	
	// Match hand pieces directly (should be 1-to-1 mapping)
	if (currentGroup.handPieces.length > 0 && prevGroup.handPieces.length > 0) {
		const currentHand = currentGroup.handPieces[0];
		const prevHand = prevGroup.handPieces[0];
		if (prevHand.id) {
			currentHand.id = prevHand.id;
		}
	}
}

/**
 * Preserve IDs for pieces of the moved type, excluding the actual moved piece
 */
function preserveNonMovingPiecesOfType(
	currentGroup: { boardPieces: Piece[], handPieces: HandPiece[] },
	prevGroup: { boardPieces: Piece[], handPieces: HandPiece[] },
	fromSquare?: string,
	toSquare?: string,
	isArata?: boolean
): void {
	if (isArata) {
		// Arata move: a hand piece moved to board
		// All current board pieces except the destination should preserve their position-based IDs
		for (const currentPiece of currentGroup.boardPieces) {
			if (currentPiece.square === toSquare) continue; // Skip the moved piece
			
			// Find previous piece at same position
			const prevAtSamePos = prevGroup.boardPieces.find(p => 
				p.square === currentPiece.square && 
				p.tier === currentPiece.tier
			);
			
			if (prevAtSamePos?.id) {
				currentPiece.id = prevAtSamePos.id;
			}
		}
		
		// Hand pieces: preserve the hand piece ID structure
		if (currentGroup.handPieces.length > 0 && prevGroup.handPieces.length > 0) {
			const currentHand = currentGroup.handPieces[0];
			const prevHand = prevGroup.handPieces[0];
			if (prevHand.id) {
				currentHand.id = prevHand.id;
			}
		}
	} else {
		// Regular board move: preserve all board pieces except source and destination
		for (const currentPiece of currentGroup.boardPieces) {
			// Skip the moved piece destination
			if (currentPiece.square === toSquare) continue;
			
			// Find previous piece at same position (should be same piece if it didn't move)
			const prevAtSamePos = prevGroup.boardPieces.find(p => 
				p.square === currentPiece.square && 
				p.tier === currentPiece.tier
			);
			
			if (prevAtSamePos?.id) {
				currentPiece.id = prevAtSamePos.id;
			}
		}
		
		// Hand pieces should be unchanged for regular moves
		if (currentGroup.handPieces.length > 0 && prevGroup.handPieces.length > 0) {
			const currentHand = currentGroup.handPieces[0];
			const prevHand = prevGroup.handPieces[0];
			if (prevHand.id) {
				currentHand.id = prevHand.id;
			}
		}
	}
}

/**
 * Get all board and hand pieces of a specific type and color
 */
function getAllPiecesOfType(state: ParsedFEN, type: PieceType, color: Color) {
	const boardPieces: Piece[] = [];
	const handPieces: HandPiece[] = [];
	
	// Collect board pieces
	for (const rank of state.board) {
		for (const file of rank) {
			for (const piece of file) {
				if (piece && piece.type === type && piece.color === color) {
					boardPieces.push(piece);
				}
			}
		}
	}
	
	// Collect hand pieces
	for (const handPiece of state.hand) {
		if (handPiece.type === type && handPiece.color === color) {
			handPieces.push(handPiece);
		}
	}
	
	return { boardPieces, handPieces };
}

/**
 * Groups pieces by type and color for ID assignment
 */
function getPieceInventory(board: Board, hand: HandPiece[]): PieceInventory {
	const inventory: PieceInventory = {};
	
	// Process board pieces
	for (const rank of board) {
		for (const file of rank) {
			for (const piece of file) {
				if (piece) {
					const key = `${piece.color}-${piece.type}`;
					if (!inventory[key]) {
						inventory[key] = { boardPieces: [], handPieces: [] };
					}
					inventory[key].boardPieces.push(piece);
				}
			}
		}
	}
	
	// Process hand pieces
	for (const handPiece of hand) {
		const key = `${handPiece.color}-${handPiece.type}`;
		if (!inventory[key]) {
			inventory[key] = { boardPieces: [], handPieces: [] };
		}
		inventory[key].handPieces.push(handPiece);
	}
	
	return inventory;
}

/**
 * Apply canonical assignment only to pieces that don't already have IDs
 */
function applyCanonicalToMissingIds(state: ParsedFEN): void {
	// Get inventory of all pieces by type and color
	const inventory = getPieceInventory(state.board, state.hand);
	
	// Assign IDs to each piece type/color group
	for (const key in inventory) {
		const group = inventory[key];
		const [color, pieceType] = key.split('-') as [Color, PieceType];
		
		// Sort pieces canonically: board pieces first, then hand pieces
		const allPieces = [
			...group.boardPieces.sort(comparePiecesCanonically),
			...group.handPieces
		];
		
		// Only assign IDs to pieces that don't already have them
		let nextNumber = 1;
		for (const piece of allPieces) {
			if (!piece.id) {
				// Find the next available number
				while (allPieces.some(p => p.id === `${color}-${pieceType}-${nextNumber}`)) {
					nextNumber++;
				}
				piece.id = `${color}-${pieceType}-${nextNumber}`;
				nextNumber++;
			}
		}
	}
}

/**
 * Canonical comparison function for board pieces
 * Sort by: rank, file, tier (lexicographic order)
 */
function comparePiecesCanonically(a: Piece, b: Piece): number {
	const [aRank, aFile] = a.square.split('-').map(Number);
	const [bRank, bFile] = b.square.split('-').map(Number);
	
	// Compare by rank first
	if (aRank !== bRank) return aRank - bRank;
	
	// Then by file
	if (aFile !== bFile) return aFile - bFile;
	
	// Finally by tier
	return a.tier - b.tier;
}