import message from './message';
import {
	A_CONSTANT,
	B_CONSTANT,
	C_CONSTANT,
	D_CONSTANT,
	e_var,
	f_let,
} from './constants';
import { g_enum } from './types';
import { a as C } from './imports1';
() => {
	A_CONSTANT;
	B_CONSTANT;
	C_CONSTANT;
	D_CONSTANT;
	e_var;
	f_let;
};
const a: number = 0;
const b: Coord = { x: a, y: 0 } as Coord;
const c = new C();
console.log(message + f_let + b.y + g_enum.A + c.a);
