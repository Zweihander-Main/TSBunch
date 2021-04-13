export enum g_enum {
	A,
	B,
}

export interface i_interface {
	i_first: string;
}

export default class {
	public i_first: string;

	constructor(a: i_interface) {
		this.i_first = a.i_first;
	}

	public test() {
		return this.i_first;
	}
}
