
type GenericObject = { [key: string]: any };
interface mod {
	exports: GenericObject;
}
interface mods {
	[key: number]: [(require: (name: string) => GenericObject, module: mod, exports: mod['exports']) => void, { [key: string]: number }]
}
(function (modules: mods): void {
	function require(id: number): GenericObject {
		const [fn, mapping] = modules[id];
		function localRequire(name: string): GenericObject {
			return require(mapping[name]);
		}
		const module: mod = { exports: {} as GenericObject };
		fn(localRequire, module, module.exports);
		return module.exports;
	}
	require(0);
})({
	0: [
		function (require: (name: string) => GenericObject, module: mod, exports: mod['exports']): void {
const  message  = require( './message').default;
const  {
	A_CONSTANT,
	B_CONSTANT,
	C_CONSTANT,
	D_CONSTANT,
	E_CONSTANT,
	F_CONSTANT,
}  = require( './constants.ts');
const a: number = 0;
console.log(message + F_CONSTANT);

		},
		{"./message":1,"./constants.ts":2},
	],
	1: [
		function (require: (name: string) => GenericObject, module: mod, exports: mod['exports']): void {
const  { name }  = require( './name.ts');

exports.default=`hello ${name}!`;

		},
		{"./name.ts":3},
	],
	2: [
		function (require: (name: string) => GenericObject, module: mod, exports: mod['exports']): void {
exports.A_CONSTANT = 1;
exports.B_CONSTANT = 2;
exports.C_CONSTANT = 3;
exports.D_CONSTANT = 4;
exports.E_CONSTANT = 5;
exports.F_CONSTANT = '!';

		},
		{},
	],
	3: [
		function (require: (name: string) => GenericObject, module: mod, exports: mod['exports']): void {
exports.name = 'world';

		},
		{},
	],})
