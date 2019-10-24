
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
const  message  = require( './message.ts').default;
const a: number = 0;
console.log(message);

		},
		{"./message.ts":1},
	],
	1: [
		function (require: (name: string) => GenericObject, module: mod, exports: mod['exports']): void {
const  { name }  = require( './name.ts');

exports.default=`hello ${name}!`;

		},
		{"./name.ts":2},
	],
	2: [
		function (require: (name: string) => GenericObject, module: mod, exports: mod['exports']): void {
exports.name = 'world';

		},
		{},
	],})
