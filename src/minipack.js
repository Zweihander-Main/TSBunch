import fs from 'fs';
import path from 'path';
import Walker from 'node-source-walk';
const Parser = require('@typescript-eslint/typescript-estree');

/**
 * Creates an asset object for the graph.
 *
 * @param      {string}  filename      Name of the file
 * @param      {{currentId: number}}  graphID       The graph id object
 * @param      {{}}  [options={}]  The options
 * @return     {{
 * 				id: number,
 * 				filename: string,
 * 				dependencies: Array<string>,
 * 				code: string}}  Asset object
 */
function createAsset(filename, graphID, options = {}) {
	if (!filename.match(/\.tsx?$/)) {
		filename = filename + '.ts';
	}
	const content = fs.readFileSync(filename, 'utf-8');

	const dependencies = [];
	const walkerOptions = Object.assign({}, options, { parser: Parser });
	const walker = new Walker(walkerOptions);
	walker.walk(content, function (node) {
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

/**
 * Creates a graph.
 *
 * @param      {string}  entry   The entry
 * @return     {Array<{
				    id: number;
				    filename: string;
				    dependencies: string[];
				    code: string;
				}>}   Traversed graph
 */
function createGraph(entry) {
	const graphID = { currentId: 0 };
	const options = {};
	const mainAsset = createAsset(entry, graphID, options);
	const queue = [mainAsset];
	for (const asset of queue) {
		asset.mapping = {};
		const dirname = path.dirname(asset.filename);
		asset.dependencies.forEach((relativePath) => {
			const absolutePath = path.join(dirname, relativePath);
			const child = createAsset(absolutePath, graphID, options);
			asset.mapping[relativePath] = child.id;
			queue.push(child);
		});
	}
	return queue;
}

/**
 * Creates bundle code
 *
 * @param      {Array<{
				    id: number;
				    filename: string;
				    dependencies: string[];
				    code: string;
				}>}  graph   The graph
 * @return     {string}  Bundle code
 */
function bundle(graph) {
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
 *
 * @param      {string}  entryFileLocation       String file path of the bundle
 * 												 entry file
 * @param      {string}  [outputFile='out.ts']   (Optional) Name of output file,
 * 												 will default to `out.ts`
 * @param      {string | Array<string>}   [declarationsFiles=[]]  Single or
 * 															      array of
 * 															      string file
 * 															      paths to files
 * 															      which will
 * 															      placed at the
 * 															      top of the
 * 															      output file
 * 															      'outside' of
 * 															      the bundle
 */
const minipack = (
	entryFileLocation,
	outputFile = 'out.ts',
	declarationsFiles = []
) => {
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
