import * as path from 'path';
export var MODULE_PREFACE = 'Mod_';
export var getAssetName = function (filepath) {
    return path.basename(filepath, path.extname(filepath));
};
