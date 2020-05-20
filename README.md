<p align="center">
    <img height="244" width="576" alt = "TSBunch Logo" src="https://raw.githubusercontent.com/Zweihander-Main/TSBunch/master/docs/TSBunch.png">
</p>

![npm](https://img.shields.io/npm/v/tsbunch)![npm](https://img.shields.io/npm/dy/tsbunch)

## 📦 TSBunch

> A VERY simple bundler for TypeScript files that doesn't transpile them to JS (Multiple .ts -> Single .ts)

### Introduction

There are plenty of TypeScript bundlers out there but none that don't also transpile TypeScript into regular JS. This bundler seeks to rectify that by providing a very simple way to concatenate multiple TypeScript modules into one TypeScript file.

The magic behind this bundler is in utilizing TypeScript's `namespace` feature rather than using the traditional bundler loading pattern.

The impetus behind this was to allow TypeScript projects composed of multiple modules to be uploaded to [CodinGame](https://www.codingame.com) (which only accepts single flat files) either by hand or by using the [CodinGame Sync App](https://chrome.google.com/webstore/detail/codingame-sync-app/nmdombhgnofjnnaenegcdehnbkajfgbh) WITHOUT transpiling those TypeScript files to JavaScript in the process.

### Usage

Installing:

```sh
$ npm install --save-dev tsbunch
```

#### tsbunch(entryFilePath, [outputFilePath], [declarationsFile(s)])

-   **entryFilePath**: String file path of the bundle entry file
-   **outputFilePath**: (Optional) Name of output file, will default to `out.ts`
-   **declarationsFile(s)**: (Optional) Single or array of string file paths to files which will placed at the top of the output file 'outside' of the bundle.

Create a file with the following in it:

```
const tsbunch = require('tsbunch');
tsbunch('path/to/entryFile.ts', 'path/to/outputFile.ts', 'path/to/declarationsFile.d.ts');
```

Finally run that file with:

```sh
$ node file.js
```

### Caveats

This bundler is using string matching rather than AST's so doesn't fully support the import/export spec:

##### Supports:

-   `import defaultExport from "module-name";`
-   `import * as name from "module-name";`
-   `import { export1 } from "module-name";`
-   `import { export1 as alias1 } from "module-name";`
-   `import { export1 , export2 } from "module-name";`
-   `import { export1 , export2 as alias2 , [...] } from "module-name";`
-   `import defaultExport, { export1 [ , [...] ] } from "module-name";`
-   `import defaultExport, * as name from "module-name";`
-   `export let name1, name2, …, nameN; // also var, const`
-   `export let name1 = …, name2 = …, …, nameN; // also var, const`
-   `export function functionName(){...}`
-   `export class ClassName {...}`
-   `export const { name1, name2: bar } = o;`
-   `export default expression;`

##### Has Partial Support

The following examples will have their function/class names changed. It's recommended to save them as constants and then export the constants rather than to directly default export them:

-   `export default function (…) { … } // also function*`
-   `export default function name1(…) { … } // also function*`
-   `export default class { … }`
-   `export default class name1{ … }`

##### Will Not Work:

-   `import { foo , bar } from "module-name/path/to/specific/un-exported/file";`
-   `import "module-name";`
-   `var promise = import("module-name");`
-   `export { name1, name2, …, nameN };`
-   `export { name1 as default, … };`
-   `export { variable1 as name1, variable2 as name2, …, nameN };`
-   `export * from …; // does not set the default export`
-   `export * as name1 from …;`
-   `export { name1, name2, …, nameN } from …;`
-   `export { import1 as name1, import2 as name2, …, nameN } from …;`
-   `export { default } from …;`

TSBunch will also not resolve any circular dependencies. If compilation is taking unusually long, it's recommended to check for these.

### Scripts

-   `npm run build`: compiles TS files
-   `npm run test`: runs all tests
-   `npm run testWatch`: runs all tests in watch mode

### Todo/Future Improvements

-   Use `tsconfig.json` for file import

### Notes

-   Example of usage [can be found here](https://github.com/Zweihander-Main/CodinGame_TS)
-   Derived from an earlier bundler which attempted the same thing called [minipack_ts](https://github.com/Zweihander-Main/minipack_ts)

### Credits

-   Forked from [minipack](https://github.com/ronami/minipack), originally created by Ronen Amiel
-   Typescript dependency checking heavily inspired from [detective-typescript](https://github.com/pahen/detective-typescript)

## Available for Hire

I'm available for freelance, contracts, and consulting both remotely and in the Hudson Valley, NY (USA) area. [Some more about me](https://www.zweisolutions.com/about.html) and [what I can do for you](https://www.zweisolutions.com/services.html).

Feel free to drop me a message at:

```
hi [a+] zweisolutions {●} com
```

## License

[MIT](./LICENSE)
