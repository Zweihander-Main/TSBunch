import defaultExport from './exports2';
import * as name from './exports1';
import { name1 } from './exports1';
import { name2 as alias1 } from './exports1';
import { name4, functionName } from './exports1';
import { nameN, name4 as alias2 } from './exports1';
import defaultExport2, { name2, name4 as alias3 } from './exports1';
import defaultExport3, * as name5 from './exports1';
() => {
	defaultExport;
	name;
	name1;
	name2;
	name4;
	name5;
	nameN;
	alias1;
	alias2;
	alias3;
	functionName;
	defaultExport2;
	defaultExport3;
};

export const a = defaultExport;
