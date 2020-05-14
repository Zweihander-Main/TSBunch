import minipack from '../minipack';
import * as path from 'path';

const entry = './src/__fixtures__/entry.ts';
const outFile = 'build/__fixtures__/out.ts';
const declarationsFile = './src/__fixtures__/globals.d.ts';

describe('minipack', function () {
	const mockLog = jest.spyOn(console, 'log');
	minipack(entry, outFile, declarationsFile);
	require(path.resolve(__dirname, '../../', outFile));
	it('outputs hello world!!0042', function (done) {
		expect(mockLog.mock.calls[0][0]).toBe('hello world!!0042');
		done();
	});
});
