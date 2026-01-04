import { ParsedFEN, parseFEN } from './fen';
import {
	Board,
	Color,
	HandPiece,
	Move,
	Piece,
	PieceType,
	setupModeToCode,
} from './utils';

/**
 * Assigns piece IDs with proper stability across moves
 * Uses explicit move tracking for maximum reliability
 */
export function assignPieceIdsWithState(
	currentFen: string,
	previousState?: ParsedFEN | null,
	move?: Move | null
): ParsedFEN {
	const currentState = parseFEN(currentFen);

	if (!previousState) {
		return assignCanonicalIds(currentState);
	}

	if (move) {
		return assignIdsWithExplicitMove(currentState, previousState, move);
	}

	// Fallback: try to preserve IDs based on position matching
	return assignIdsWithPositionMatching(currentState, previousState);
}

/**
 * Assigns IDs canonically for initial state
 * Format: mode-color-type-number (e.g., "1-w-兵-1")
 */
function assignCanonicalIds(state: ParsedFEN): ParsedFEN {
	const result = cloneState(state);
	const modeCode = setupModeToCode[state.mode];

	// Group all pieces by type and color
	const pieceGroups = groupPiecesByTypeAndColor(result);

	// Assign IDs sequentially within each group
	Object.entries(pieceGroups).forEach(([key, pieces]) => {
		const [color, type] = key.split('|') as [Color, PieceType];

		// Sort pieces canonically: board pieces by position, then hand pieces
		const sortedPieces = sortPiecesCanonically(pieces);

		sortedPieces.forEach((piece, index) => {
			piece.id = `${modeCode}-${color}-${type}-${index + 1}`;
		});
	});

	return result;
}

/**
 * Assigns IDs using explicit move tracking - the core robust method
 */
function assignIdsWithExplicitMove(
	currentState: ParsedFEN,
	previousState: ParsedFEN,
	move: Move
): ParsedFEN {
	const result = cloneStateWithoutIds(currentState);
	const modeCode = setupModeToCode[currentState.mode];

	// Step 1: Identify exactly which pieces are affected by this move
	const affectedPieces = identifyAffectedPieces(move);

	// Step 2: Preserve IDs for all NON-affected pieces
	preserveUnaffectedPieceIds(result, previousState, affectedPieces);

	// Step 3: Handle affected pieces explicitly based on move type
	handleAffectedPieces(result, previousState, move, modeCode);

	// Step 4: Assign IDs to any remaining pieces without IDs
	assignMissingIds(result, modeCode);

	return result;
}

/**
 * Identify exactly which pieces are affected by a move
 */
function identifyAffectedPieces(move: Move): {
	movingPiece?: { square: string; tier: number; type: PieceType; color: Color };
	capturedPieces: Array<{
		square: string;
		tier: number;
		type: PieceType;
		color: Color;
	}>;
	placementSquare?: string;
	handPieceTypes: Array<{ color: Color; type: PieceType }>;
} {
	const capturedPieces: Array<{
		square: string;
		tier: number;
		type: PieceType;
		color: Color;
	}> = [];
	const handPieceTypes: Array<{ color: Color; type: PieceType }> = [];
	let movingPiece:
		| { square: string; tier: number; type: PieceType; color: Color }
		| undefined;
	let placementSquare: string | undefined;

	switch (move.type) {
		case 'route':
		case 'tsuke':
			// Track the specific moving piece
			if (move.from) {
				const [fromRank, fromFile, fromTier] = move.from.split('-').map(Number);
				movingPiece = {
					square: `${fromRank}-${fromFile}`,
					tier: fromTier,
					type: move.piece,
					color: move.color,
				};
			}
			break;

		case 'capture':
			// Track moving piece and captured pieces
			if (move.from) {
				const [fromRank, fromFile, fromTier] = move.from.split('-').map(Number);
				movingPiece = {
					square: `${fromRank}-${fromFile}`,
					tier: fromTier,
					type: move.piece,
					color: move.color,
				};
			}
			// Track captured pieces
			if (move.captured) {
				move.captured.forEach((capturedPiece) => {
					capturedPieces.push({
						square: move.to,
						tier: capturedPiece.tier,
						type: capturedPiece.type,
						color: capturedPiece.color,
					});
				});
			}
			break;

		case 'arata':
			// Hand piece affected + placement square
			handPieceTypes.push({ color: move.color, type: move.piece });
			placementSquare = move.to;
			break;

		case 'betray':
			// Track moving tactician and captured/converted pieces
			if (move.from) {
				const [fromRank, fromFile, fromTier] = move.from.split('-').map(Number);
				movingPiece = {
					square: `${fromRank}-${fromFile}`,
					tier: fromTier,
					type: move.piece,
					color: move.color,
				};
			}
			// Track captured pieces
			if (move.captured) {
				move.captured.forEach((capturedPiece) => {
					capturedPieces.push({
						square: move.to,
						tier: capturedPiece.tier,
						type: capturedPiece.type,
						color: capturedPiece.color,
					});
				});
				// Hand pieces for converted pieces
				move.captured.forEach((capturedPiece) => {
					handPieceTypes.push({ color: move.color, type: capturedPiece.type });
				});
			}
			break;
	}

	return { movingPiece, capturedPieces, placementSquare, handPieceTypes };
}

/**
 * Preserve IDs for all pieces NOT affected by the move
 */
function preserveUnaffectedPieceIds(
	currentState: ParsedFEN,
	previousState: ParsedFEN,
	affectedPieces: {
		movingPiece?: {
			square: string;
			tier: number;
			type: PieceType;
			color: Color;
		};
		capturedPieces: Array<{
			square: string;
			tier: number;
			type: PieceType;
			color: Color;
		}>;
		placementSquare?: string;
		handPieceTypes: Array<{ color: Color; type: PieceType }>;
	}
): void {
	// Helper function to check if a specific piece is affected
	const isPieceAffected = (
		square: string,
		tier: number,
		type: PieceType,
		color: Color
	): boolean => {
		// Check if it's the moving piece
		if (
			affectedPieces.movingPiece &&
			affectedPieces.movingPiece.square === square &&
			affectedPieces.movingPiece.tier === tier &&
			affectedPieces.movingPiece.type === type &&
			affectedPieces.movingPiece.color === color
		) {
			return true;
		}

		// Check if it's a captured piece
		if (
			affectedPieces.capturedPieces.some(
				(captured) =>
					captured.square === square &&
					captured.tier === tier &&
					captured.type === type &&
					captured.color === color
			)
		) {
			return true;
		}

		// Check if it's at the placement square (for arata moves)
		if (affectedPieces.placementSquare === square) {
			return true;
		}

		return false;
	};

	// Preserve board piece IDs (skip only specifically affected pieces)
	for (let rank = 0; rank < 9; rank++) {
		for (let file = 0; file < 9; file++) {
			const square = `${rank + 1}-${9 - file}`;
			const currentTower = currentState.board[rank][file];
			const previousTower = previousState.board[rank][file];

			// Check each piece in the tower individually
			for (
				let tier = 0;
				tier < Math.min(currentTower.length, previousTower.length);
				tier++
			) {
				const currentPiece = currentTower[tier];
				const previousPiece = previousTower[tier];

				if (
					currentPiece &&
					previousPiece &&
					currentPiece.type === previousPiece.type &&
					currentPiece.color === previousPiece.color &&
					previousPiece.id
				) {
					// Only preserve ID if this specific piece was not affected
					if (
						!isPieceAffected(
							square,
							tier + 1,
							currentPiece.type,
							currentPiece.color
						)
					) {
						currentPiece.id = previousPiece.id;
					}
				}
			}
		}
	}

	// Preserve hand piece IDs (skip affected types)
	currentState.hand.forEach((currentHandPiece) => {
		const isAffected = affectedPieces.handPieceTypes.some(
			(affected) =>
				affected.color === currentHandPiece.color &&
				affected.type === currentHandPiece.type
		);

		if (!isAffected) {
			const previousHandPiece = previousState.hand.find(
				(hp) =>
					hp.type === currentHandPiece.type &&
					hp.color === currentHandPiece.color
			);
			if (previousHandPiece?.id) {
				currentHandPiece.id = previousHandPiece.id;
			}
		}
	});
}

/**
 * Handle pieces that are affected by the move
 */
function handleAffectedPieces(
	currentState: ParsedFEN,
	previousState: ParsedFEN,
	move: Move,
	modeCode: number
): void {
	switch (move.type) {
		case 'route':
		case 'tsuke':
			handleRegularMove(currentState, previousState, move);
			break;

		case 'capture':
			handleCaptureMove(currentState, previousState, move);
			break;

		case 'arata':
			handleArataMove(currentState, previousState, move, modeCode);
			break;

		case 'betray':
			handleBetrayalMove(currentState, previousState, move, modeCode);
			break;
	}
}

/**
 * Handle regular moves (route/tsuke) - preserve the moving piece's ID
 */
function handleRegularMove(
	currentState: ParsedFEN,
	previousState: ParsedFEN,
	move: Move
): void {
	if (!move.from) return;

	// Parse the from position to get tier info
	const [fromRank, fromFile, fromTier] = move.from.split('-').map(Number);
	const fromSquare = `${fromRank}-${fromFile}`;

	// Find the piece that moved in the previous state with exact tier
	const movedPiece = findPieceAtSquare(
		previousState.board,
		fromSquare,
		move.piece,
		move.color,
		fromTier
	);
	if (!movedPiece?.id) return;

	// Parse the to position to get tier info
	const [toRank, toFile, toTier] = move.to.split('-').map(Number);
	const toSquare = `${toRank}-${toFile}`;

	// Find where it ended up in the current state with exact tier
	const newPiece = findPieceAtSquare(
		currentState.board,
		toSquare,
		move.piece,
		move.color,
		toTier
	);
	if (newPiece) {
		newPiece.id = movedPiece.id;
	}
}

/**
 * Handle capture moves - preserve moving piece, captured pieces are removed
 */
function handleCaptureMove(
	currentState: ParsedFEN,
	previousState: ParsedFEN,
	move: Move
): void {
	// Handle the moving piece same as regular move
	handleRegularMove(currentState, previousState, move);
	// Captured pieces are already removed from the board, their IDs are freed
}

/**
 * Handle arata moves - board piece inherits hand ID for animation continuity,
 * hand piece (if still has count > 0) gets new ID
 */
function handleArataMove(
	currentState: ParsedFEN,
	previousState: ParsedFEN,
	move: Move,
	modeCode: number
): void {
	// Find the hand piece in the previous state
	const prevHandPiece = previousState.hand.find(
		(hp) => hp.type === move.piece && hp.color === move.color
	);

	if (!prevHandPiece?.id) return;

	// Parse the to position to get tier info for finding the exact placed piece
	const [toRank, toFile, toTier] = move.to.split('-').map(Number);
	const toSquare = `${toRank}-${toFile}`;

	// CRITICAL: Board piece INHERITS the hand piece's ID for animation continuity
	// This allows framer-motion layoutId to animate the piece from hand to board
	const placedPiece = findPieceAtSquare(
		currentState.board,
		toSquare,
		move.piece,
		move.color,
		toTier
	);
	if (placedPiece) {
		placedPiece.id = prevHandPiece.id;
	}

	// Hand piece (if still exists with count > 0) gets a NEW ID
	// This ensures unique IDs and allows the "remaining" hand pieces to be distinct
	const currentHandPiece = currentState.hand.find(
		(hp) => hp.type === move.piece && hp.color === move.color
	);
	if (currentHandPiece) {
		const nextId = findNextAvailableId(
			currentState,
			modeCode,
			move.color,
			move.piece
		);
		currentHandPiece.id = nextId;
	}
}

/**
 * Handle betrayal moves - complex move with conversions
 */
function handleBetrayalMove(
	currentState: ParsedFEN,
	previousState: ParsedFEN,
	move: Move,
	modeCode: number
): void {
	// Handle the tactician's movement
	handleRegularMove(currentState, previousState, move);

	// Handle hand piece additions from conversions
	if (move.captured) {
		move.captured.forEach((capturedPiece) => {
			const handPiece = currentState.hand.find(
				(hp) => hp.type === capturedPiece.type && hp.color === move.color
			);
			// Hand pieces from conversions get new IDs (they're essentially new pieces)
			if (handPiece && !handPiece.id) {
				const nextId = findNextAvailableId(
					currentState,
					modeCode,
					move.color,
					capturedPiece.type
				);
				handPiece.id = nextId;
			}
		});
	}
}

/**
 * Fallback method using position-based matching when move info unavailable
 */
function assignIdsWithPositionMatching(
	currentState: ParsedFEN,
	previousState: ParsedFEN
): ParsedFEN {
	const result = cloneState(currentState);
	const modeCode = setupModeToCode[currentState.mode];

	// Simple position-based matching for all pieces
	for (let rank = 0; rank < 9; rank++) {
		for (let file = 0; file < 9; file++) {
			const currentTower = result.board[rank][file];
			const previousTower = previousState.board[rank][file];

			for (
				let tier = 0;
				tier < Math.min(currentTower.length, previousTower.length);
				tier++
			) {
				const currentPiece = currentTower[tier];
				const previousPiece = previousTower[tier];

				if (
					currentPiece &&
					previousPiece &&
					currentPiece.type === previousPiece.type &&
					currentPiece.color === previousPiece.color &&
					previousPiece.id
				) {
					currentPiece.id = previousPiece.id;
				}
			}
		}
	}

	// Match hand pieces
	result.hand.forEach((currentHandPiece) => {
		const previousHandPiece = previousState.hand.find(
			(hp) =>
				hp.type === currentHandPiece.type && hp.color === currentHandPiece.color
		);
		if (previousHandPiece?.id) {
			currentHandPiece.id = previousHandPiece.id;
		}
	});

	// Assign missing IDs
	assignMissingIds(result, modeCode);

	return result;
}

/**
 * Assign IDs to pieces that don't have them yet
 */
function assignMissingIds(state: ParsedFEN, modeCode: number): void {
	const usedIds = new Set(getAllUsedIds(state));
	const pieceGroups = groupPiecesByTypeAndColor(state);

	Object.entries(pieceGroups).forEach(([key, pieces]) => {
		const [color, type] = key.split('|') as [Color, PieceType];

		pieces.forEach((piece) => {
			if (!piece.id) {
				// Find the next available number for this type/color combination
				let number = 1;
				let candidateId = `${modeCode}-${color}-${type}-${number}`;

				while (usedIds.has(candidateId)) {
					number++;
					candidateId = `${modeCode}-${color}-${type}-${number}`;
				}

				piece.id = candidateId;
				usedIds.add(candidateId);
			}
		});
	});
}

/**
 * Find the next available ID for a specific piece type and color
 */
function findNextAvailableId(
	state: ParsedFEN,
	modeCode: number,
	color: Color,
	type: PieceType
): string {
	const usedIds = new Set(getAllUsedIds(state));

	let number = 1;
	let candidateId = `${modeCode}-${color}-${type}-${number}`;

	while (usedIds.has(candidateId)) {
		number++;
		candidateId = `${modeCode}-${color}-${type}-${number}`;
	}

	return candidateId;
}

/**
 * Get all currently used IDs in the state
 */
function getAllUsedIds(state: ParsedFEN): string[] {
	const ids: string[] = [];

	// Collect from board
	for (const rank of state.board) {
		for (const file of rank) {
			for (const piece of file) {
				if (piece?.id) {
					ids.push(piece.id);
				}
			}
		}
	}

	// Collect from hand
	for (const handPiece of state.hand) {
		if (handPiece.id) {
			ids.push(handPiece.id);
		}
	}

	return ids;
}

/**
 * Group all pieces by type and color for ID assignment
 */
function groupPiecesByTypeAndColor(
	state: ParsedFEN
): Record<string, Array<Piece | HandPiece>> {
	const groups: Record<string, Array<Piece | HandPiece>> = {};

	// Process board pieces
	for (const rank of state.board) {
		for (const file of rank) {
			for (const piece of file) {
				if (piece) {
					const key = `${piece.color}|${piece.type}`;
					if (!groups[key]) groups[key] = [];
					groups[key].push(piece);
				}
			}
		}
	}

	// Process hand pieces
	for (const handPiece of state.hand) {
		const key = `${handPiece.color}|${handPiece.type}`;
		if (!groups[key]) groups[key] = [];
		groups[key].push(handPiece);
	}

	return groups;
}

/**
 * Sort pieces canonically for consistent ID assignment
 */
function sortPiecesCanonically(
	pieces: Array<Piece | HandPiece>
): Array<Piece | HandPiece> {
	return pieces.sort((a, b) => {
		// Board pieces come before hand pieces
		const aIsBoard = 'square' in a;
		const bIsBoard = 'square' in b;

		if (aIsBoard && !bIsBoard) return -1;
		if (!aIsBoard && bIsBoard) return 1;

		// Both are board pieces - sort by square and tier
		if (aIsBoard && bIsBoard) {
			const aPiece = a as Piece;
			const bPiece = b as Piece;

			if (aPiece.square !== bPiece.square) {
				const [aRank, aFile] = aPiece.square.split('-').map(Number);
				const [bRank, bFile] = bPiece.square.split('-').map(Number);

				if (aRank !== bRank) return aRank - bRank;
				return aFile - bFile;
			}

			return aPiece.tier - bPiece.tier;
		}

		// Both are hand pieces - maintain original order
		return 0;
	});
}

/**
 * Find a piece at a specific square with optional filters
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
		if (
			piece &&
			(!type || piece.type === type) &&
			(!color || piece.color === color) &&
			(!tier || piece.tier === tier)
		) {
			return piece;
		}
	}

	return null;
}

/**
 * Create a deep clone of the parsed FEN state
 */
function cloneState(state: ParsedFEN): ParsedFEN {
	return {
		board: state.board.map((rank) =>
			rank.map((file) => file.map((piece) => (piece ? { ...piece } : piece)))
		),
		hand: state.hand.map((hp) => ({ ...hp })),
		turn: state.turn,
		mode: state.mode,
		drafting: { ...state.drafting },
		moveNumber: state.moveNumber,
	};
}

/**
 * Create a deep clone of the parsed FEN state WITHOUT any IDs
 */
function cloneStateWithoutIds(state: ParsedFEN): ParsedFEN {
	return {
		board: state.board.map((rank) =>
			rank.map((file) =>
				file.map((piece) => (piece ? { ...piece, id: undefined } : piece))
			)
		),
		hand: state.hand.map((hp) => ({ ...hp, id: undefined })),
		turn: state.turn,
		mode: state.mode,
		drafting: { ...state.drafting },
		moveNumber: state.moveNumber,
	};
}
