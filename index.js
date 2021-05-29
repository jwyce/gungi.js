const { Gungi } = require('./lib/gungi.js');
const gungi = new Gungi();
console.log(
	gungi.move({
		src: { type: gungi.MARSHAL, color: gungi.BLACK },
		dst: '8-2',
		type: gungi.PLACE,
	})
);
console.log(gungi.ascii());
gungi.move({
	src: { type: gungi.MARSHAL, color: gungi.WHITE },
	dst: '2-5',
	type: gungi.PLACE,
});
console.log(gungi.ascii());
gungi.move({
	src: { type: gungi.PAWN, color: gungi.BLACK },
	dst: '7-2',
	type: gungi.PLACE,
});
console.log(gungi.ascii());
gungi.move({
	src: { type: gungi.PAWN, color: gungi.WHITE },
	dst: '1-5',
	type: gungi.PLACE,
});
console.log(gungi.ascii());
gungi.move({ src: null, dst: null, type: gungi.READY });
gungi.move({ src: null, dst: null, type: gungi.READY });
console.log(gungi.ascii());
console.log(
	gungi.move({
		src: '2-5',
		dst: '3-5',
		type: gungi.MOVEMENT,
	})
);
console.log(gungi.ascii());
gungi.move({
	src: '8-2',
	dst: '7-2',
	type: gungi.STACK,
});
console.log('phase', gungi.phase);
console.log('turn', gungi.turn);
console.log('moves', gungi.moves());
console.log(gungi.ascii());
console.log(
	gungi.move({
		src: '3-5',
		dst: '4-6',
		type: gungi.MOVEMENT,
	})
);
console.log(gungi.ascii());
console.log(gungi.moves());
