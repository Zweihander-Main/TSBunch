import { __spreadArrays } from "tslib";
import * as fs from 'fs';
import * as path from 'path';
import Walker from 'node-source-walk';
import * as Parser from '@typescript-eslint/typescript-estree';
import generateReplacedModuleCode from './generateReplacedModuleCode';
import { MODULE_PREFACE, getAssetName } from './shared';
function createAsset(filepath, graphID, options) {
    if (options === void 0) { options = {}; }
    if (!RegExp(/\.tsx?$/).exec(filepath)) {
        filepath = filepath + '.ts';
    }
    var filename = getAssetName(filepath);
    var content = fs.readFileSync(filepath, 'utf-8');
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
    var code = generateReplacedModuleCode(content);
    return {
        id: id,
        filepath: filepath,
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
        var dirname = path.dirname(asset.filepath);
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
    queue.sort(function (a, b) {
        if (!a.mapping) {
            return 1; //a is main entry, should come later
        }
        if (!b.mapping) {
            return -1; //b is main entry, should come later
        }
        var idArrayA = Object.values(a.mapping);
        var idArrayB = Object.values(b.mapping);
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
    var uniqueGraph = queue.filter(function (asset, index, arr) {
        return arr.map(function (val) { return val.filepath; }).indexOf(asset.filepath) === index;
    });
    return uniqueGraph;
}
function bundle(graph) {
    var modules = '';
    var declarations = '';
    var main = '';
    graph.forEach(function (asset) {
        if (asset.id === -1) {
            declarations += "" + asset.code;
        }
        else if (asset.id === 0) {
            main += "\n" + asset.code;
        }
        else {
            modules += "\nnamespace " + MODULE_PREFACE + asset.filename + " {\n" + asset.code.replace(/^(?!\s*$)/gm, '	') + "}\n";
        }
    });
    var result = declarations + modules + main;
    return result;
}
/**
 * Bundles multiple TypeScript files into a single TypeScript file without
 * compiling the code.
 */
var tsbunch = function (entryFileLocation, outputFile, declarationsFiles) {
    if (outputFile === void 0) { outputFile = 'out.ts'; }
    if (declarationsFiles === void 0) { declarationsFiles = []; }
    var graph = createGraph(entryFileLocation);
    if (!Array.isArray(declarationsFiles)) {
        declarationsFiles = [declarationsFiles];
    }
    var extraFiles = declarationsFiles.map(function (filepath) {
        var code = fs
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
    var result = bundle(__spreadArrays(graph, extraFiles));
    fs.writeFileSync(outputFile, result);
};
export default tsbunch;
