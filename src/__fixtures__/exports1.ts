export let name1, name2, nameN;
export let name3 = (name2 = nameN);
export function functionName() {}
export class ClassName {}
const o = {
	name4: name1,
	name2,
};
export const { name4, name2: bar } = o;
export default function* () {}
