import { BEGINNNER_POSITION, Gungi } from './gungi';

export * from './gungi';

const gungi = new Gungi(BEGINNNER_POSITION);
gungi.load(
	'3img3/1ra1n1as1/d1fwdwf1d/9/9/2|j:n|6/D1F|W:T|DWF1D/1SA1N1AR1/3GMI3 J2N2S1R1D1/j2n2s1r1d1 w 3 - 20'
);

gungi.print();

console.log(gungi.moves({ square: '7-6', verbose: true }));
