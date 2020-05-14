import { MODULE_PREFACE, getAssetName } from './shared';

// import defaultExport from "module-name";
function replaceDefaultExport(_match: string, p1: string, p2: string): string {
	return `import ${p1} = ${MODULE_PREFACE}${getAssetName(
		p2
	)}.${MODULE_PREFACE}default;`;
}

function checkAggregatedExport(p1: string): RegExpExecArray | null {
	return /\* *as (\w+)/gm.exec(p1);
}

function checkAliasExport(p1: string): RegExpExecArray | null {
	return /(\w+) *as (\w+)/gm.exec(p1);
}

function generateAggregatedExportReplacement(
	nameMatch: RegExpExecArray,
	p2: string
): string {
	return `import ${nameMatch[1]} = ${MODULE_PREFACE}${getAssetName(p2)};`;
}

function generateAliasExportReplacement(
	nameMatch: RegExpExecArray,
	p2: string
): string {
	return `import ${nameMatch[2]} = ${MODULE_PREFACE}${getAssetName(p2)}.${
		nameMatch[1]
	};`;
}

// import * as name from "module-name";
function replaceAggregatedExport(
	_match: string,
	p1: string,
	p2: string,
	_offset: number,
	string: string
): string {
	const isAggregatedExport = checkAggregatedExport(p1);
	if (isAggregatedExport) {
		return generateAggregatedExportReplacement(isAggregatedExport, p2);
	}
	return string;
}

// import { export1 } from "module-name";
// import { export1 as alias1 } from "module-name";
// import { export1 , export2 } from "module-name";
// import { export1 , export2 as alias2 , [...] } from "module-name";
function replaceNamedExport(_match: string, p1: string, p2: string): string {
	let returnString = '';
	const importArray = p1.split(',').map((str) => str.trim());
	importArray.forEach((imp, index) => {
		const isAggregatedExport = checkAggregatedExport(imp);
		const isAliasExport = checkAliasExport(imp);
		if (isAggregatedExport) {
			returnString += generateAggregatedExportReplacement(
				isAggregatedExport,
				p2
			);
		} else if (isAliasExport) {
			returnString += generateAliasExportReplacement(isAliasExport, p2);
		} else if (imp !== '') {
			returnString += `import ${imp} = ${MODULE_PREFACE}${getAssetName(
				p2
			)}.${imp};`;
		}
		if (index !== importArray.length - 1) {
			returnString += '\n';
		}
	});

	return returnString;
}

// import defaultExport, { export1 [ , [...] ] } from "module-name";
function replaceDefaultAndNamed(
	_match: string,
	p1: string,
	p2: string,
	p3: string
): string {
	let returnString = '';
	returnString += replaceDefaultExport(_match, p1, p3) + '\n';
	returnString += replaceNamedExport(_match, p2, p3);
	return returnString;
}

// import defaultExport, * as name from "module-name";
function replaceDefaultAndAggregated(
	_match: string,
	p1: string,
	p2: string,
	p3: string
): string {
	let returnString = '';
	returnString += replaceDefaultExport(_match, p1, p3) + '\n';
	returnString += replaceAggregatedExport(_match, p2, p3, 0, '');
	return returnString;
}

export default function generateReplacedModuleCode(content: string): string {
	/*
	Imports:
		WILL NOT WORK -- import { foo , bar } from "module-name/path/to/specific/un-exported/file";
		WILL NOT WORK -- import "module-name";
		WILL NOT WORK -- var promise = import("module-name");
	*/
	let replacedModuleCode = content
		.replace(
			/import +((?:[^{}=*])+?) +from *['"]([^=;]*)['"] *;?/gm,
			replaceDefaultExport
		)
		.replace(
			/import +((?:[^{}=,])+?) +from *['"]([^=;]*)['"] *;?/gm,
			replaceAggregatedExport
		)
		.replace(
			/import *{ *([^]+?) *} *from *['"]([^;=]*)['"] *;?/gm,
			replaceNamedExport
		)
		.replace(
			/import +((?:[^{}=*])+?) *, *{ *([^]+?) *} *from *['"]([^;=]*)['"] *;?/gm,
			replaceDefaultAndNamed
		)
		.replace(
			/import +((?:[^{}=*])+?) *, +((?:[^{}=,])+?) +from *['"]([^;=]*)['"] *;?/gm,
			replaceDefaultAndAggregated
		);

	/*
	Exports:
		Will work out the gate:
		export let name1, name2, …, nameN; // also var, const
		export let name1 = …, name2 = …, …, nameN; // also var, const
		export function functionName(){...}
		export class ClassName {...}
		export const { name1, name2: bar } = o;

		WILL NOT WORK -- export { name1, name2, …, nameN };
		WILL NOT WORK -- export { name1 as default, … };
		WILL NOT WORK -- export { variable1 as name1, variable2 as name2, …, nameN };
		WILL NOT WORK -- export * from …; // does not set the default export
		WILL NOT WORK -- export * as name1 from …;
		WILL NOT WORK -- export { name1, name2, …, nameN } from …;
		WILL NOT WORK -- export { import1 as name1, import2 as name2, …, nameN } from …;
		WILL NOT WORK -- export { default } from …;

	*/

	replacedModuleCode = replacedModuleCode
		// export default function (…) { … } // also function*
		// export default function name1(…) { … } // also function*
		// Note: Will change name
		.replace(
			/export +default +(function\*?) *\w* *\(/gm,
			`export $1 ${MODULE_PREFACE}default (`
		)
		// export default class { … }
		// export default class name1{ … }
		// Note: Will change name
		.replace(
			/export +default class *\w* *{/gm,
			`export class ${MODULE_PREFACE}default {`
		)
		// export default expression;
		.replace(
			/export default ([^;]*);?/gm,
			`export const ${MODULE_PREFACE}default = $1;`
		);
	return replacedModuleCode;
}

/**
 * import defaultExport from "module-name";
import * as name from "module-name";
import { export1 } from "module-name";
import { export1 as alias1 } from "module-name";
import { export1 , export2 } from "module-name";
import { foo , bar } from "module-name/path/to/specific/un-exported/file";
import { export1 , export2 as alias2 , [...] } from "module-name";
import defaultExport, { export1 [ , [...] ] } from "module-name";
import defaultExport, * as name from "module-name";
import "module-name";
var promise = import("module-name");
 */
