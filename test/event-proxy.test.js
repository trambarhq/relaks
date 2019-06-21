import _ from 'lodash';
import { delay } from 'bluebird';
import { expect } from 'chai';

import { AsyncEventProxy } from '../index';

describe('Event Proxy', function() {
    it ('should automatically create handlers', function() {
        const proxy = new AsyncEventProxy;
        expect(proxy.transitionStart).to.be.a('function');
        expect(proxy.transitionEnd).to.be.a('function');
    })
    it ('should call persist() on event object', function() {
        const proxy = new AsyncEventProxy;
        expect(proxy.transitionStart).to.be.a('function');
        let persisting = false;
        const evt = {
            persist: () => {
                persisting = true;
                return {};
            },
        };
        proxy.transitionStart(evt);
        expect(persisting).to.be.true;
    })
    it ('should ignore further calls once promise fulfills', function() {
        const proxy = new AsyncEventProxy;
        expect(proxy.transitionStart).to.be.a('function');
        let count = 0;
        const evt = {
            persist: () => {
                count++;
                return {};
            },
        };
        proxy.transitionStart(evt);
        proxy.transitionStart(evt);
        proxy.transitionStart(evt);
        proxy.transitionStart(evt);
        expect(count).to.equal(1);
    })
    describe('#one()', function() {
        it ('should return a promise', function() {
            const proxy = new AsyncEventProxy;
            expect(proxy.transitionStart).to.be.a('function');
            expect(proxy.one('transitionStart')).to.be.an.instanceOf(Promise);
        })
        it ('should return undefined when there is no handler by that name', function() {
            const proxy = new AsyncEventProxy;
            expect(proxy.one('transitionStart')).to.be.an('undefined');
        })
        it ('should fulfills when handler is called', async function() {
            const proxy = new AsyncEventProxy;
            expect(proxy.transitionStart).to.be.a('function');

            const evt = {};
            let timeout = false;
            setTimeout(() => { timeout = true }, 50);
            setTimeout(() => { proxy.transitionStart(evt) }, 100);
            const result = await proxy.one('transitionStart');
            expect(timeout).to.be.true;
            expect(result).to.equal(evt);
        })
    })
    describe('#all()', function() {
        it ('should wait for all promises', async function() {
            const proxy = new AsyncEventProxy;
            expect(proxy.transitionStart).to.be.a('function');
            expect(proxy.transitionEnd).to.be.a('function');

            let timeout1 = false, timeout2 = false;
            setTimeout(() => { timeout1 = true }, 50);
            setTimeout(() => { timeout2 = true }, 150);
            setTimeout(() => { proxy.transitionStart({ timeout1, timeout2 }) }, 100);
            setTimeout(() => { proxy.transitionEnd({ timeout1, timeout2 }) }, 200);
            const results = await proxy.all();
            expect(timeout1).to.be.true;
            expect(timeout2).to.be.true;
            expect(results.transitionStart).to.have.property('timeout1', true);
            expect(results.transitionStart).to.have.property('timeout2', false);
            expect(results.transitionEnd).to.have.property('timeout1', true);
            expect(results.transitionEnd).to.have.property('timeout2', true);
        })
    })
    describe('#some()', function() {
        it ('should wait for selected promises', async function() {
            const proxy = new AsyncEventProxy;
            expect(proxy.transitionStart).to.be.a('function');
            expect(proxy.transitionEnd).to.be.a('function');

            let timeout1 = false, timeout2 = false;
            setTimeout(() => { timeout1 = true }, 50);
            setTimeout(() => { timeout2 = true }, 150);
            setTimeout(() => { proxy.transitionStart({ timeout1, timeout2 }) }, 100);
            setTimeout(() => { proxy.transitionEnd({ timeout1, timeout2 }) }, 200);
            const results = await proxy.some([ 'transitionStart', 'transitionEnd', 'bogus' ]);
            expect(timeout1).to.be.true;
            expect(timeout2).to.be.true;
            expect(results.transitionStart).to.have.property('timeout1', true);
            expect(results.transitionStart).to.have.property('timeout2', false);
            expect(results.transitionEnd).to.have.property('timeout1', true);
            expect(results.transitionEnd).to.have.property('timeout2', true);
            expect(results.bogus).to.be.an('undefined');
        })
    })
    describe('#match()', function() {
        it ('should wait for matching promises', async function() {
            const proxy = new AsyncEventProxy;
            expect(proxy.transitionStart).to.be.a('function');
            expect(proxy.transitionEnd).to.be.a('function');

            let timeout1 = false, timeout2 = false;
            setTimeout(() => { timeout1 = true }, 50);
            setTimeout(() => { timeout2 = true }, 150);
            setTimeout(() => { proxy.transitionStart({ timeout1, timeout2 }) }, 100);
            setTimeout(() => { proxy.transitionEnd({ timeout1, timeout2 }) }, 200);
            const results = await proxy.match(/Start$/);
            expect(timeout1).to.be.true;
            expect(timeout2).to.be.false;
            expect(results.transitionStart).to.have.property('timeout1', true);
            expect(results.transitionStart).to.have.property('timeout2', false);
            expect(results.transitionEnd).to.be.an('undefined');;
        })
    })
    describe('#race()', function() {
        it ('should resolve when one handler is called', async function() {
            const proxy = new AsyncEventProxy;
            expect(proxy.transitionStart).to.be.a('function');
            expect(proxy.transitionEnd).to.be.a('function');

            let timeout1 = false, timeout2 = false;
            setTimeout(() => { timeout1 = true }, 50);
            setTimeout(() => { timeout2 = true }, 150);
            setTimeout(() => { proxy.transitionStart({ timeout1, timeout2 }) }, 100);
            setTimeout(() => { proxy.transitionEnd({ timeout1, timeout2 }) }, 200);
            const result = await proxy.race();
            expect(timeout1).to.be.true;
            expect(timeout2).to.be.false;
            expect(result).to.have.property('timeout1', true);
            expect(result).to.have.property('timeout2', false);
        })
    })
    describe('#isFulfilled()', function() {
        it ('should return true when handler was called', async function() {
            const proxy = new AsyncEventProxy;
            expect(proxy.transitionStart).to.be.a('function');
            expect(proxy.transitionEnd).to.be.a('function');

            let timeout1 = false, timeout2 = false;
            setTimeout(() => { timeout1 = true }, 50);
            setTimeout(() => { timeout2 = true }, 150);
            setTimeout(() => { proxy.transitionStart({ timeout1, timeout2 }) }, 100);
            setTimeout(() => { proxy.transitionEnd({ timeout1, timeout2 }) }, 200);
            await proxy.race();
            const result1 = proxy.isFulfilled('transitionStart');
            const result2 = proxy.isFulfilled('transitionEnd');
            const result3 = proxy.isFulfilled('bogus');
            expect(result1).to.be.true;
            expect(result2).to.be.false;
            expect(result3).to.be.false;
        })
    })
    describe('#isPending()', function() {
        it ('should return true when handler has not yet been called', async function() {
            const proxy = new AsyncEventProxy;
            expect(proxy.transitionStart).to.be.a('function');
            expect(proxy.transitionEnd).to.be.a('function');

            let timeout1 = false, timeout2 = false;
            setTimeout(() => { timeout1 = true }, 50);
            setTimeout(() => { timeout2 = true }, 150);
            setTimeout(() => { proxy.transitionStart({ timeout1, timeout2 }) }, 100);
            setTimeout(() => { proxy.transitionEnd({ timeout1, timeout2 }) }, 200);
            await proxy.race();
            const result1 = proxy.isPending('transitionStart');
            const result2 = proxy.isPending('transitionEnd');
            const result3 = proxy.isPending('bogus');
            expect(result1).to.be.false;
            expect(result2).to.be.true;
            expect(result3).to.be.false;
        })
    })
    describe('#filter()', function() {
        it ('should filter out non-matching events', async function() {
            const proxy = new AsyncEventProxy;
            expect(proxy.keyDown).to.be.a('function');

            proxy.filter('keyDown', (evt) => {
                return (evt.keyCode === 27);
            });

            let timeout1 = false, timeout2 = false;
            setTimeout(() => { timeout1 = true }, 50);
            setTimeout(() => { timeout2 = true }, 150);
            setTimeout(() => { proxy.keyDown({ keyCode: 32 }) }, 25);
            setTimeout(() => { proxy.keyDown({ keyCode: 78 }) }, 75);
            setTimeout(() => { proxy.keyDown({ keyCode: 66 }) }, 100);
            setTimeout(() => { proxy.keyDown({ keyCode: 27 }) }, 200);
            const result = await proxy.race();
            expect(timeout1).to.be.true;
            expect(timeout2).to.be.true;
            expect(result).to.have.property('keyCode', 27);
        })
    })
})
