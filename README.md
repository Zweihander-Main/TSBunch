## 📦 Minipack_TS

> A VERY simple bundler designed to bundle TypeScript without compiling it into JS (Multiple .ts -> Single .ts)

### Introduction

There are plenty of TypeScript bundlers out there but none that don't also compile TypeScript into regular JS. This bundler seeks to rectify that by providing a very simple way to concatenate multiple TypeScript modules into one TypeScript file.

The impetus behind this was to allow TypeScript projects composed of multiple modules to be uploaded to [CodinGame](https://www.codingame.com) (which only accepts single flat files) either by hand or by using the [CodinGame Sync App](https://chrome.google.com/webstore/detail/codingame-sync-app/nmdombhgnofjnnaenegcdehnbkajfgbh) WITHOUT converting those TypeScript files to JavaScript in the process.

### Usage

#### minipack(entryFilePath, outputFilePath)

Start by installing dependencies:

```sh
$ npm install
```

And then create a file with the following in it:

```
import minipack from 'minipack.js'; //point to location of src/minipack.js
minipack('path/to/entryFile.ts', 'path/to/outputFile.ts');

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
-   `export let/var/const name`
-   `export let/var/const name = expression`

This will also not resolve any circular dependencies.

### Credits

-   Forked from [minipack](https://github.com/ronami/minipack), originally created by Ronen Amiel
-   Typescript dependency checking heavily inspired from [detective-typescript](https://github.com/pahen/detective-typescript)
