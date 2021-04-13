/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'node-source-walk';

interface WalkerOptions {
	[key: string]: any;
}

type AST = any;

class Walker {
	constructor(options: WalkerOptions);

	walk(src: string, cb: Function): void;
	moonwalk(node: any, cb: Function): void;
	stopWalking(): void;
	traverse(node: any, cb: Function): void;
	parse(src: string): AST;
}
