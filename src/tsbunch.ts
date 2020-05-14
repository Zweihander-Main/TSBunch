import * as fs from 'fs';
import * as path from 'path';
import Walker from 'node-source-walk';
import * as Parser from '@typescript-eslint/typescript-estree';
import generateReplacedModuleCode from './generateReplacedModuleCode';
import { MODULE_PREFACE, getAssetName } from './shared';

interface GraphID {
	currentId: number;
}

interface Asset {
	id: number;
	filepath: string;
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
	filepath: string,
	graphID: GraphID,
	options: CreateAssetOptions = {}
): Asset {
	if (!RegExp(/\.tsx?$/).exec(filepath)) {
		filepath = filepath + '.ts';
	}
	const filename = getAssetName(filepath);
	const content = fs.readFileSync(filepath, 'utf-8');

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

	const code = generateReplacedModuleCode(content);

	return {
		id,
		filepath,
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
		const dirname = path.dirname(asset.filepath);
		asset.dependencies.forEach((relativePath) => {
			const absolutePath = path.join(dirname, relativePath);
			const child = createAsset(absolutePath, graphID, options);
			if (asset.mapping) {
				asset.mapping[relativePath] = child.id;
			}
			queue.push(child);
		});
	}

	queue.sort((a, b) => {
		if (!a.mapping) {
			return 1; //a is main entry, should come later
		}
		if (!b.mapping) {
			return -1; //b is main entry, should come later
		}

		const idArrayA = Object.values(a.mapping);
		const idArrayB = Object.values(b.mapping);

		if (idArrayA.includes(b.id)) {
			return 1; //b is dep of a, b should come earlier
		}
		if (idArrayB.includes(a.id)) {
			return -1; //a is dep of b, a should come earlier
		}
		return -1; // default to moving a up
	});

	// Very quadratic, will pick first entry of each which should work for
	// simple dependency management
	const uniqueGraph = queue.filter((asset, index, arr) => {
		return arr.map((val) => val.filepath).indexOf(asset.filepath) === index;
	});
	return uniqueGraph;
}

function bundle(graph: Graph): string {
	let modules = '';
	let declarations = '';
	let main = '';
	graph.forEach((asset) => {
		if (asset.id === -1) {
			declarations += `${asset.code}`;
		} else if (asset.id === 0) {
			main += `
${asset.code}`;
		} else {
			modules += `
namespace ${MODULE_PREFACE}${asset.filename} {
${asset.code.replace(/^(?!\s*$)/gm, '	')}}
`;
		}
	});
	const result = declarations + modules + main;
	return result;
}

/**
 * Bundles multiple TypeScript files into a single TypeScript file without
 * compiling the code.
 */
const tsbunch = (
	entryFileLocation: string,
	outputFile = 'out.ts',
	declarationsFiles: string | Array<string> = []
): void => {
	const graph = createGraph(entryFileLocation);
	if (!Array.isArray(declarationsFiles)) {
		declarationsFiles = [declarationsFiles];
	}
	const extraFiles = declarationsFiles.map((filepath) => {
		const code = fs
			.readFileSync(filepath, 'utf-8')
			.replace(/^declare /m, '');
		return {
			id: -1,
			filepath: filepath,
			filename: getAssetName(filepath),
			dependencies: [],
			code: code,
		};
	});
	const result = bundle([...graph, ...extraFiles]);
	fs.writeFileSync(outputFile, result);
};

export default tsbunch;
