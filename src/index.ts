import { Gungi } from './gungi';

export * from './gungi';

const gungi = new Gungi({
	fen: '3img3/1ra3as1/d1fwd|w:n|f1d/9/9/9/D1FWDWF1D/1SA1|N:G|1|A:S|R1/4MI3 b 1 0 2',
});

gungi.print();
