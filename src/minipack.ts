import * as fs from 'fs';
import * as path from 'path';
import Walker from 'node-source-walk';
import * as Parser from '@typescript-eslint/typescript-estree';

interface GraphID {
	currentId: number;
}

interface Asset {
	id: number;
	filename: string;
	dependencies: Array<string>;
	code: string;
}

interface GraphAsset extends Asset {
	mapping?: {
		[key: string]: number;
	};
}

type Graph = Array<GraphAsset>;

interface CreateAssetOptions {
	skipTypeImports?: boolean;
}

function createAsset(
	filename: string,
	graphID: GraphID,
	options: CreateAssetOptions = {}
): Asset {
	if (!RegExp(/\.tsx?$/).exec(filename)) {
		filename = filename + '.ts';
	}
	const content = fs.readFileSync(filename, 'utf-8');

	const dependencies: Array<string> = [];
	const walkerOptions = Object.assign({}, options, { parser: Parser });
	const walker = new Walker(walkerOptions);
	walker.walk(content, function (node: any) {
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
					!options.skipTypeImports &&
					node.parameter.type === 'TSLiteralType'
				) {
					dependencies.push(node.parameter.literal.value);
				}
				break;
		}
	});
	const id = graphID.currentId++;

	const code = content
		.replace(
			/import([^{}]*?)from([^;]*);?/gm,
			'const $1 = require($2).default;'
		)
		.replace(/import([^]*?)from([^;]*);?/gm, 'const $1 = require($2);')
		.replace(/export default ([^;]*);?/gm, 'exports.default=$1;')
		.replace(/export (?:const|var|let) (.+)=([^;]*);?/gm, 'exports.$1=$2;')
		.replace(/export (enum (.+) {([^}]*)})/gm, '$1\nexports.$2=$2');

	return {
		id,
		filename,
		dependencies,
		code,
	};
}

function createGraph(entry: string): Graph {
	const graphID = { currentId: 0 };
	const options = {};
	const mainAsset = createAsset(entry, graphID, options);
	const queue: Graph = [mainAsset];
	for (const asset of queue) {
		asset.mapping = {};
		const dirname = path.dirname(asset.filename);
		asset.dependencies.forEach((relativePath) => {
			const absolutePath = path.join(dirname, relativePath);
			const child = createAsset(absolutePath, graphID, options);
			if (asset.mapping) {
				asset.mapping[relativePath] = child.id;
			}
			queue.push(child);
		});
	}
	return queue;
}

function bundle(graph: Graph): string {
	let modules = '';
	let declarations = '';
	graph.forEach((mod) => {
		if (mod.id === -1) {
			declarations += `${mod.code}`;
		} else {
			modules += `
	${mod.id}: [
		function (require: (name: string) => GenericObject, module: mod, exports: mod['exports']): void {
${mod.code}
		},
		${JSON.stringify(mod.mapping)},
	],`;
		}
	});
	const result =
		declarations +
		`
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

/**
 * Bundles multiple TypeScript files into a single TypeScript file without
 * compiling the code.
 */
const minipack = (
	entryFileLocation: string,
	outputFile = 'out.ts',
	declarationsFiles: string | Array<string> = []
): void => {
	const graph = createGraph(entryFileLocation);
	if (!Array.isArray(declarationsFiles)) {
		declarationsFiles = [declarationsFiles];
	}
	const extraFiles = declarationsFiles.map((filename) => {
		const code = fs.readFileSync(filename, 'utf-8');
		return {
			id: -1,
			filename: filename,
			dependencies: [],
			code: code,
		};
	});
	const result = bundle([...graph, ...extraFiles]);
	fs.writeFileSync(outputFile, result);
};

export default minipack;
