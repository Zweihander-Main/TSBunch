import { __spreadArrays } from "tslib";
import * as fs from 'fs';
import * as path from 'path';
import Walker from 'node-source-walk';
import * as Parser from '@typescript-eslint/typescript-estree';
function createAsset(filename, graphID, options) {
    if (options === void 0) { options = {}; }
    if (!RegExp('.tsx?$').exec(filename)) {
        filename = filename + '.ts';
    }
    var content = fs.readFileSync(filename, 'utf-8');
    var dependencies = [];
    var walkerOptions = Object.assign({}, options, { parser: Parser });
    var walker = new Walker(walkerOptions);
    walker.walk(content, function (node) {
        switch (node.type) {
            case 'Import':
                if (node.parent &&
                    node.parent.type === 'CallExpression' &&
                    node.parent.arguments.length) {
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
                if (!options.skipTypeImports &&
                    node.parameter.type === 'TSLiteralType') {
                    dependencies.push(node.parameter.literal.value);
                }
                break;
        }
    });
    var id = graphID.currentId++;
    var code = content
        .replace(/import([^{}]*?)from([^;]*);?/gm, 'const $1 = require($2).default;')
        .replace(/import([^]*?)from([^;]*);?/gm, 'const $1 = require($2);')
        .replace(/export default ([^;]*);?/gm, 'exports.default=$1;')
        .replace(/export (?:const|var|let) (.+)=([^;]*);?/gm, 'exports.$1=$2;')
        .replace(/export (enum (.+) {([^}]*)})/gm, '$1\nexports.$2=$2');
    return {
        id: id,
        filename: filename,
        dependencies: dependencies,
        code: code,
    };
}
function createGraph(entry) {
    var graphID = { currentId: 0 };
    var options = {};
    var mainAsset = createAsset(entry, graphID, options);
    var queue = [mainAsset];
    var _loop_1 = function (asset) {
        asset.mapping = {};
        var dirname = path.dirname(asset.filename);
        asset.dependencies.forEach(function (relativePath) {
            var absolutePath = path.join(dirname, relativePath);
            var child = createAsset(absolutePath, graphID, options);
            if (asset.mapping) {
                asset.mapping[relativePath] = child.id;
            }
            queue.push(child);
        });
    };
    for (var _i = 0, queue_1 = queue; _i < queue_1.length; _i++) {
        var asset = queue_1[_i];
        _loop_1(asset);
    }
    return queue;
}
function bundle(graph) {
    var modules = '';
    var declarations = '';
    graph.forEach(function (mod) {
        if (mod.id === -1) {
            declarations += "" + mod.code;
        }
        else {
            modules += "\n\t" + mod.id + ": [\n\t\tfunction (require: (name: string) => GenericObject, module: mod, exports: mod['exports']): void {\n" + mod.code + "\n\t\t},\n\t\t" + JSON.stringify(mod.mapping) + ",\n\t],";
        }
    });
    var result = declarations +
        ("\ntype GenericObject = { [key: string]: any };\ninterface mod {\n\texports: GenericObject;\n}\ninterface mods {\n\t[key: number]: [(require: (name: string) => GenericObject, module: mod, exports: mod['exports']) => void, { [key: string]: number }]\n}\n(function (modules: mods): void {\n\tfunction require(id: number): GenericObject {\n\t\tconst [fn, mapping] = modules[id];\n\t\tfunction localRequire(name: string): GenericObject {\n\t\t\treturn require(mapping[name]);\n\t\t}\n\t\tconst module: mod = { exports: {} as GenericObject };\n\t\tfn(localRequire, module, module.exports);\n\t\treturn module.exports;\n\t}\n\trequire(0);\n})({" + modules + "})\n");
    return result;
}
/**
 * Bundles multiple TypeScript files into a single TypeScript file without
 * compiling the code.
 */
var minipack = function (entryFileLocation, outputFile, declarationsFiles) {
    if (outputFile === void 0) { outputFile = 'out.ts'; }
    if (declarationsFiles === void 0) { declarationsFiles = []; }
    var graph = createGraph(entryFileLocation);
    if (!Array.isArray(declarationsFiles)) {
        declarationsFiles = [declarationsFiles];
    }
    var extraFiles = declarationsFiles.map(function (filename) {
        var code = fs.readFileSync(filename, 'utf-8');
        return {
            id: -1,
            filename: filename,
            dependencies: [],
            code: code,
        };
    });
    var result = bundle(__spreadArrays(graph, extraFiles));
    fs.writeFileSync(outputFile, result);
};
export default minipack;
//# sourceMappingURL=minipack.js.map