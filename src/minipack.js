import fs from 'fs';
import path from 'path';
import Walker from 'node-source-walk';
const Parser = require('@typescript-eslint/typescript-estree');

let ID = 0;

function createAsset(filename, options = {}) {
	const content = fs.readFileSync(filename, 'utf-8');

	const dependencies = [];
	const walkerOptions = Object.assign({}, options, { parser: Parser });
	const walker = new Walker(walkerOptions);
	walker.walk(content, function(node) {
		switch (node.type) {
			case 'Import':
				if (
					node.parent &&
					node.parent.type === 'CallExpression' &&
					node.parent.arguments.length
				) {
					dependencies.push(node.parent.arguments[0].value);
				}
				break;
			case 'ImportDeclaration':
				if (node.source && node.source.value) {
					dependencies.push(node.source.value);
				}
				break;
			case 'ExportNamedDeclaration':
			case 'ExportAllDeclaration':
				if (node.source && node.source.value) {
					dependencies.push(node.source.value);
				}
				break;
			case 'TSExternalModuleReference':
				if (node.expression && node.expression.value) {
					dependencies.push(node.expression.value);
				}
				break;
			case 'TSImportType':
				if (
					!skipTypeImports &&
					node.parameter.type === 'TSLiteralType'
				) {
					dependencies.push(node.parameter.literal.value);
				}
				break;
		}
	});
	const id = ID++;

	const code = content
		.replace(
			/import([^{}]*)from([^;]*);?/gm,
			'const $1 = require($2).default;'
		)
		.replace(/import(.*)from([^;]*);?/gm, 'const $1 = require($2);')
		.replace(/export default ([^;]*);?/gm, 'exports.default=$1;')
		.replace(/export (?:const|var|let) (.*)=([^;]*);?/gm, 'exports.$1=$2;');

	return {
		id,
		filename,
		dependencies,
		code,
	};
}

function createGraph(entry) {
	const mainAsset = createAsset(entry);
	const queue = [mainAsset];
	for (const asset of queue) {
		asset.mapping = {};
		const dirname = path.dirname(asset.filename);
		asset.dependencies.forEach((relativePath) => {
			const absolutePath = path.join(dirname, relativePath);
			const child = createAsset(absolutePath);
			asset.mapping[relativePath] = child.id;
			queue.push(child);
		});
	}
	return queue;
}

function bundle(graph) {
	let modules = '';
	graph.forEach((mod) => {
		modules += `
	${mod.id}: [
		function (require: (name: string) => GenericObject, module: mod, exports: mod['exports']): void {
${mod.code}
		},
		${JSON.stringify(mod.mapping)},
	],`;
	});
	const result = `
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
})({${modules}})
`;
	return result;
}

export default (entryFileLocation, outputFile = 'out.ts') => {
	const graph = createGraph(entryFileLocation);
	const result = bundle(graph);
	fs.writeFileSync(outputFile, result);
};
