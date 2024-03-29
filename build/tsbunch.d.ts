/**
 * Bundles multiple TypeScript files into a single TypeScript file without
 * compiling the code.
 */
declare const tsbunch: (entryFileLocation: string, outputFile?: string, declarationsFiles?: string | Array<string>) => void;
export default tsbunch;
