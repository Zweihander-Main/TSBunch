import minipack from '../minipack.js';
import path from 'path';

const entry = './src/__fixtures__/entry.ts';
const outFile = 'build/__fixtures__/out.ts';
const declarationsFile = './src/__fixtures__/globals.d.ts';

describe('minipack', function () {
	console.log = jest.fn();
	minipack(entry, outFile, declarationsFile);
	const generated = require(path.resolve(__dirname, '../../', outFile));
	it('outputs hello world!!0', function (done) {
		expect(console.log.mock.calls[0][0]).toBe('hello world!!00');
		done();
	});
});
