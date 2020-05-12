import message from './message';
import {
	A_CONSTANT,
	B_CONSTANT,
	C_CONSTANT,
	D_CONSTANT,
	e_var,
	f_let,
	g_enum,
} from './constants';
() => {
	A_CONSTANT;
	B_CONSTANT;
	C_CONSTANT;
	D_CONSTANT;
	e_var;
	f_let;
	g_enum;
};
const a: number = 0;
const b: Coord = { x: a, y: 0 } as Coord;
console.log(message + f_let + b.y + g_enum.A);
