import * as path from 'path';
export const MODULE_PREFACE = 'Mod_';

export const getAssetName = (filepath: string): string => {
	return path.basename(filepath, path.extname(filepath));
};
