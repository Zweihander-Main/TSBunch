import minipack from '../minipack.js';
import path from 'path';

const entry = './src/__fixtures__/entry.ts';
const outFile = 'src/__fixtures__/build/out.ts';

describe('minipack', function() {
	// it('does not error out', function(done) {
	// 	try {
	// 		minipack(entry, outFile);
	// 		expect(true).toBe(true);
	// 	} catch (e) {
	// 		console.log(e);
	// 		expect(true).toBe(false);
	// 	} finally {
	// 		done();
	// 	}
	// });
	it('outputs hello world!', function(done) {
		console.log = jest.fn();
		minipack(entry, outFile);
		const generated = require(path.resolve(__dirname, '../../', outFile));
		expect(console.log.mock.calls[0][0]).toBe('hello world!');
		done();
	});
});
