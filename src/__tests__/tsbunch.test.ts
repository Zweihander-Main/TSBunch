import tsbunch from '../tsbunch';
import * as path from 'path';
import * as fs from 'fs';

const entry = './src/__fixtures__/entry.ts';
const outDir = 'build/__fixtures__';
const outFile = 'build/__fixtures__/out.ts';
const declarationsFile = './src/__fixtures__/globals.d.ts';

if (!fs.existsSync(path.resolve(__dirname, '../../', outDir))) {
	fs.mkdirSync(path.resolve(__dirname, '../../', outDir));
}
if (!fs.existsSync(path.resolve(__dirname, '../../', outFile))) {
	fs.writeFileSync(path.resolve(__dirname, '../../', outFile), '');
}

describe('tsbunch', function () {
	const mockLog = jest.spyOn(console, 'log');
	tsbunch(entry, outFile, declarationsFile);
	require(path.resolve(__dirname, '../../', outFile));
	it('outputs hello world!!0042', function (done) {
		expect(mockLog.mock.calls[0][0]).toBe('hello world!!0042');
		done();
	});
});
