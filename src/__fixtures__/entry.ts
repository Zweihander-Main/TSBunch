import message from './message';
import {
	A_CONSTANT,
	B_CONSTANT,
	C_CONSTANT,
	D_CONSTANT,
	E_CONSTANT,
	F_CONSTANT,
} from './constants.ts';
const a: number = 0;
const b: Coord = { x: a, y: 0 } as Coord;
console.log(message + F_CONSTANT + b.y);
