export const theName = 'world';

import theClass from './types';
import { i_interface, g_enum } from './types';

const a = new theClass({ i_first: theName } as i_interface);
const b: g_enum = g_enum.A;
() => {
	b;
	a;
};
