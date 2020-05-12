## 📦 Minipack_TS

> A VERY simple bundler designed to bundle TypeScript without compiling it into JS (Multiple .ts -> Single .ts)

### Introduction

There are plenty of TypeScript bundlers out there but none that don't also compile TypeScript into regular JS. This bundler seeks to rectify that by providing a very simple way to concatenate multiple TypeScript modules into one TypeScript file.

The impetus behind this was to allow TypeScript projects composed of multiple modules to be uploaded to [CodinGame](https://www.codingame.com) (which only accepts single flat files) either by hand or by using the [CodinGame Sync App](https://chrome.google.com/webstore/detail/codingame-sync-app/nmdombhgnofjnnaenegcdehnbkajfgbh) WITHOUT converting those TypeScript files to JavaScript in the process.

### Usage

Installing:

```sh
$ npm install --save-dev minipack_ts
```

#### minipack(entryFilePath, [outputFilePath], [declarationsFile(s)])

-   **entryFilePath**: String file path of the bundle entry file
-   **outputFilePath**: (Optional) Name of output file, will default to `out.ts`
-   **declarationsFile(s)**: (Optional) Single or array of string file paths to files which will placed at the top of the output file 'outside' of the bundle

Create a file with the following in it:

```
const minipack = require('minipack_ts');
minipack('path/to/entryFile.ts', 'path/to/outputFile.ts', 'path/to/declarationsFile.d.ts');
```

Finally run that file with:

```sh
$ node file.js
```

### Caveats

This bundler is VERY basic so only the following module expressions are supported:

-   `import defaultExport from 'path'`
-   `import { export1 } from 'path'`
-   `import { export1, export2 } from 'path'`
-   `export default expression`
-   `export default function(){}`
-   `export let/var/const/enum name`
-   `export let/var/const/enum name = expression`

This will also not resolve any circular dependencies.

Enums can be used as variables but not types. `ex_enum.TYPE` works but `let a: ex_enum` does not and should be written as `let a: number`.

### Scripts

-   `npm run build`: applies Babel
-   `npm run test`: runs all tests
-   `npm run testWatch`: runs all tests in watch mode

### Todo/Future Improvements

-   Use `tsconfig.json` for file import

### Notes

-   Example of usage [can be found here](https://github.com/Zweihander-Main/CodinGame_TS)

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
