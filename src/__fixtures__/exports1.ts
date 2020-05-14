export let name1: null = null,
	name2: null = null,
	nameN: null = null;
export let name3: null = (name2 = nameN);
export function functionName() {}
export class ClassName {}
const o = {
	name4: name1,
	name2,
};
export const { name4, name2: bar } = o;
export default function* () {}
