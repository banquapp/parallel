'use strict';

const parallel = require('../..');
const { promisify } = require('util');
const delay = promisify(setTimeout);
const { expect } = require('chai');

describe('runInParallel', () => {

	it('processes input generator values in 2 concurrent Promises', async () => {

		const input = ['a', 'b', 'c', 'd', 'e'].values();
		const output = {};
		const startTs = Date.now();

		const result = parallel(input, 2, async el => {
			await delay(50);
			return { el, ts: Date.now() - startTs };
		});

		for await (const { el, ts } of result)
			output[el] = ts;

		const { a, b, c, d, e } = output;

		expect(a).to.be.gte(50).and.lt(100);
		expect(b).to.be.gte(50).and.lt(100);
		expect(c).to.be.gte(100).and.lt(150);
		expect(d).to.be.gte(100).and.lt(150);
		expect(e).to.be.gte(150);
	});

	it('handles 1m input values in 10k concurrent Promises', async () => {

		const length = 1000000;
		const input = Array.from({ length }, (v, i) => i + 1);
		const result = parallel(input.values(), 10000, el => el * 2);

		let resultCount = 0;
		let resultLastValue;

		for await (const v of result) {
			resultCount++;
			resultLastValue = v;
		}

		expect(resultCount).to.eq(length);
		expect(resultLastValue).to.eq(length * 2);
	});

	it('produces results in same sequence as input comes in', async () => {

		const input = [1, 2, 3, 4, 5].values();
		const start = Date.now();

		const result = parallel(input, 2, async el => {
			if (el === 2)
				await delay(100); // 2nd element processing takes longer
			if (el === 3)
				await delay(20);

			return [el, Date.now() - start];
		});

		const sequence = [];
		const times = [];

		for await (const el of result) {
			sequence.push(el[0]);
			times.push(el[1]);
		}

		expect(sequence).to.eql([1, 2, 3, 4, 5]);

		expect(times[0]).to.be.lte(5);
		expect(times[1]).to.be.gte(100).lte(105);

		// 3rd processing time not affected by 2nd element processing delay, since they are processed in parallel
		expect(times[2]).to.be.gte(20).lte(25);

		// 4th and 5th processing times are after 2nd and 3rd elements are released from the queue
		expect(times[3]).to.be.gte(100).lte(105);
		expect(times[4]).to.be.gte(100).lte(105);
	});
});
