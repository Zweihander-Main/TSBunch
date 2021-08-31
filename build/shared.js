"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAssetName = exports.MODULE_PREFACE = void 0;
var tslib_1 = require("tslib");
var path = (0, tslib_1.__importStar)(require("path"));
exports.MODULE_PREFACE = 'Mod_';
var getAssetName = function (filepath) {
    return path.basename(filepath, path.extname(filepath));
};
exports.getAssetName = getAssetName;
