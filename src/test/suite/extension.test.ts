import * as assert from 'assert';
import { makePossiblePaths, EnteredPath, PossiblePath, parseString } from '../../extension';

suite('Input Regular Expression Suite', () => {
	test('RE starting with dot', () => {
		assert.deepStrictEqual(parseString('./wow/'), {
			prefix: '', varname: null, dots: './', root: null, path: 'wow/'
		});
		assert.deepStrictEqual(parseString('\'./wow/'), {
			prefix: '\'', varname: null, dots: './', root: null, path: 'wow/'
		});
		assert.deepStrictEqual(parseString('\"./wow/'), {
			prefix: '\"', varname: null, dots: './', root: null, path: 'wow/'
		});
		assert.deepStrictEqual(parseString('=./wow/'), {
			prefix: '=', varname: null, dots: './', root: null, path: 'wow/'
		});
	});

	test('RE starting with two dots', () => {
		assert.deepStrictEqual(parseString('../wow/'), {
			prefix: '', varname: null, dots: '../', root: null, path: 'wow/'
		});
		assert.deepStrictEqual(parseString('\'../wow/'), {
			prefix: '\'', varname: null, dots: '../', root: null, path: 'wow/'
		});
		assert.deepStrictEqual(parseString('\"../wow/'), {
			prefix: '\"', varname: null, dots: '../', root: null, path: 'wow/'
		});
		assert.deepStrictEqual(parseString('=../wow/'), {
			prefix: '=', varname: null, dots: '../', root: null, path: 'wow/'
		});
	});

	test('RE variable name', () => {
		assert.deepStrictEqual(parseString('${HOME}/wow/'), {
			prefix: '', varname: 'HOME', dots: null, root: null, path: 'wow/'
		});
		assert.deepStrictEqual(parseString('\'${HOME}/wow/'), {
			prefix: '\'', varname: 'HOME', dots: null, root: null, path: 'wow/'
		});
		assert.deepStrictEqual(parseString('\"${HOME}/wow/'), {
			prefix: '\"', varname: 'HOME', dots: null, root: null, path: 'wow/'
		});
		assert.deepStrictEqual(parseString('=${HOME}/wow/'), {
			prefix: '=', varname: 'HOME', dots: null, root: null, path: 'wow/'
		});
	});

	test('RE root', () => {
		assert.deepStrictEqual(parseString('/wow/'), {
			prefix: '', varname: null, dots: null, root: '/', path: 'wow/'
		});
		assert.deepStrictEqual(parseString('\'/wow/'), {
			prefix: '\'', varname: null, dots: null, root: '/', path: 'wow/'
		});
		assert.deepStrictEqual(parseString('\"/wow/'), {
			prefix: '\"', varname: null, dots: null, root: '/', path: 'wow/'
		});
		assert.deepStrictEqual(parseString('=/wow/'), {
			prefix: '=', varname: null, dots: null, root: '/', path: 'wow/'
		});
	});

	test('RE fails on incorrect input', () => {
		assert.ok(parseString('===') === null);
	});
});

