"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _nodeSourceWalk = _interopRequireDefault(require("node-source-walk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Parser = require('@typescript-eslint/typescript-estree');

let ID = 0;

function createAsset(filename, options = {}) {
  const content = _fs.default.readFileSync(filename, 'utf-8');

  const dependencies = [];
  const walkerOptions = Object.assign({}, options, {
    parser: Parser
  });
  const walker = new _nodeSourceWalk.default(walkerOptions);
  walker.walk(content, function (node) {
    switch (node.type) {
      case 'Import':
        if (node.parent && node.parent.type === 'CallExpression' && node.parent.arguments.length) {
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
        if (!skipTypeImports && node.parameter.type === 'TSLiteralType') {
          dependencies.push(node.parameter.literal.value);
        }

        break;
    }
  });
  const id = ID++;
  const code = content.replace(/import([^{}]*)from([^;]*);?/gm, 'const $1 = require($2).default;').replace(/import(.*)from([^;]*);?/gm, 'const $1 = require($2);').replace(/export default ([^;]*);?/gm, 'exports.default=$1;').replace(/export (?:const|var|let) (.*)=([^;]*);?/gm, 'exports.$1=$2;');
  return {
    id,
    filename,
    dependencies,
    code
  };
}

function createGraph(entry) {
  const mainAsset = createAsset(entry);
  const queue = [mainAsset];

  for (const asset of queue) {
    asset.mapping = {};

    const dirname = _path.default.dirname(asset.filename);

    asset.dependencies.forEach(relativePath => {
      const absolutePath = _path.default.join(dirname, relativePath);

      const child = createAsset(absolutePath);
      asset.mapping[relativePath] = child.id;
      queue.push(child);
    });
  }

  return queue;
}

function bundle(graph) {
  let modules = '';
  graph.forEach(mod => {
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

var _default = (entryFileLocation, outputFile = 'out.ts') => {
  const graph = createGraph(entryFileLocation);
  const result = bundle(graph);

  _fs.default.writeFileSync(outputFile, result);
};

exports.default = _default;