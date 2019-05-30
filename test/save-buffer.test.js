import _ from 'lodash';
import { delay } from 'bluebird';
import { expect } from 'chai';

import { AsyncSaveBuffer } from '../index';

describe('Save buffer', function() {
    it ('should return the original value', async function() {
        const state = [
            {},
            function(v) { state[0] = v }
        ];
        const object = {
            hello: 'world'
        };
        const buffer = AsyncSaveBuffer.acquire(state, {
            original: object,
        });
        expect(buffer.original).to.equal(object);
        expect(buffer.current).to.equal(object);
    })
    describe('#set()', function() {
        it ('should set the current value', async function() {
            let updated = false;
            const state = [
                {},
                function(v) {
                    state[0] = v;
                    updated = true;
                }
            ];
            const object = {
                hello: 'world'
            };
            const buffer = AsyncSaveBuffer.acquire(state, {
                original: object,
            });
            const newObject = {
                hello: 'donut'
            };
            buffer.set(newObject);
            expect(buffer.original).to.equal(object);
            expect(buffer.current).to.equal(newObject);
            expect(buffer.changed).to.be.true;
            expect(updated).to.be.true;
        })
        it ('should set changed to false when given what matches the original', async function() {
            const state = [
                {},
                function(v) { state[0] = v }
            ];
            const object = {
                hello: 'world'
            };
            let compared = false;
            const buffer = AsyncSaveBuffer.acquire(state, {
                original: object,
                compare: (ours, theirs) => {
                    compared = true;
                    return _.isEqual(ours, theirs);
                },
            });
            const newObject = {
                hello: 'donut'
            };
            buffer.set(newObject);
            expect(buffer.changed).to.be.true;
            expect(buffer.unsaved).to.be.true;
            await delay(50);
            const newerObject = {
                hello: 'world'
            };
            buffer.set(newerObject);
            expect(buffer.changed).to.be.false;
            expect(buffer.unsaved).to.be.false;
            expect(compared).to.be.true;
        })
    })
    describe('#assign()', function() {
        it ('should assign properties to object', async function() {
            const state = [
                {},
                function(v) {
                    state[0] = v;
                }
            ];
            const object = {
                hello: 'world'
            };
            const buffer = AsyncSaveBuffer.acquire(state, {
                original: object,
            });
            buffer.assign({ hello: 'chicken' });
            expect(buffer.original).to.equal(object);
            expect(buffer.current).to.deep.equal({ hello: 'chicken' });
            expect(buffer.changed).to.be.true;
        })
        it ('should accept multiple parameters', async function() {
            const state = [
                {},
                function(v) {
                    state[0] = v;
                }
            ];
            const object = {
                hello: 'world'
            };
            const buffer = AsyncSaveBuffer.acquire(state, {
                original: object,
            });
            buffer.assign({ hello: 'chicken' }, { world: 'beef' });
            expect(buffer.current).to.deep.equal({ hello: 'chicken', world: 'beef' });
        })
        it ('should tolerate null and undefined', async function() {
            const state = [
                {},
                function(v) {
                    state[0] = v;
                }
            ];
            const object = {
                hello: 'world'
            };
            const buffer = AsyncSaveBuffer.acquire(state, {
                original: object,
            });
            buffer.assign(null, undefined, { hello: 'chicken' });
            expect(buffer.current).to.deep.equal({ hello: 'chicken' });
        })
        it ('should trigger autosave', async function() {
            const state = [
                {},
                function(v) {
                    state[0] = v;
                }
            ];
            const object = {
                hello: 'world'
            };
            let saved;
            const buffer = AsyncSaveBuffer.acquire(state, {
                original: object,
                save: async function(theirs, ours) {
                    await delay(50);
                    saved = ours;
                },
                autosave: 50,
            });
            buffer.assign({ hello: 'chicken' });
            expect(buffer.original).to.equal(object);
            expect(buffer.current).to.deep.equal({ hello: 'chicken' });
            expect(buffer.changed).to.be.true;

            await delay(200);
            expect(saved).to.deep.equal({ hello: 'chicken' });
        })
    })
    describe('#reset()', function() {
        it ('should reset the current value back to the original', async function() {
            const state = [
                {},
                function(v) {
                    state[0] = v;
                }
            ];
            const object = {
                hello: 'world'
            };
            const buffer = AsyncSaveBuffer.acquire(state, {
                original: object,
            });
            buffer.assign({ hello: 'chicken' });
            expect(buffer.original).to.equal(object);
            expect(buffer.current).to.deep.equal({ hello: 'chicken' });
            expect(buffer.changed).to.be.true;

            buffer.reset();
            expect(buffer.current).to.equal(object);
            expect(buffer.changed).to.be.false;
        })
    })
    describe('#save()', function() {
        it ('should call supplied save() function', async function() {
            const state = [
                {},
                function(v) {
                    state[0] = v;
                }
            ];
            const object = {
                hello: 'world'
            };
            let saved;
            const save = async function(theirs, ours) {
                await delay(50);
                saved = ours;
                return saved;
            };
            const buffer = AsyncSaveBuffer.acquire(state, {
                original: object,
                save,
            });
            buffer.assign({ hello: 'chicken' });
            expect(buffer.original).to.equal(object);
            expect(buffer.current).to.deep.equal({ hello: 'chicken' });
            expect(buffer.changed).to.be.true;

            let promise = buffer.save();
            expect(buffer.saving).to.be.true;
            await promise;
            expect(saved).to.deep.equal({ hello: 'chicken' });
        })
    })
    describe('#use()', function() {
        it ('should set current to new original value when there are no changes', async function() {
            const state = [
                {},
                function(v) { state[0] = v }
            ];
            const object = {
                hello: 'world'
            };
            const buffer = AsyncSaveBuffer.acquire(state, {
                original: object,
            });
            expect(buffer.original).to.equal(object);
            expect(buffer.current).to.equal(object);

            const newObject = {
                hello: 'bingo'
            };
            buffer.use({
                original: newObject
            });
            expect(buffer.original).to.equal(newObject);
            expect(buffer.current).to.equal(newObject);
            expect(buffer.changed).to.be.false;
        })
        it ('should trigger a merge when there are changes', async function() {
            const state = [
                {},
                function(v) { state[0] = v }
            ];
            const object = {
                hello: 'world'
            };
            const buffer = AsyncSaveBuffer.acquire(state, {
                original: object,
            });
            expect(buffer.original).to.equal(object);
            expect(buffer.current).to.equal(object);

            buffer.assign({ hello: 'chicken' });
            expect(buffer.original).to.equal(object);
            expect(buffer.current).to.deep.equal({ hello: 'chicken' });
            expect(buffer.changed).to.be.true;

            const newObject = {
                hello: 'world',
                ninja: 'turkey sandwich'
            };
            let merged;
            const merge = (base, ours, theirs) => {
                expect(base).to.equal(object),
                expect(ours).to.deep.equal({ hello: 'chicken' });
                expect(theirs).to.equal(newObject);
                merged = {
                    hello: 'chicken',
                    ninja: 'turkey sandwich'
                };
                return merged;
            };
            buffer.use({
                original: newObject,
                merge,
            });
            expect(buffer.original).to.equal(newObject);
            expect(buffer.current).to.equal(merged);
            expect(buffer.changed).to.be.true;
        })
        it ('should call set unsaved to false after save() is called', async function() {
            const state = [
                {},
                function(v) {
                    state[0] = v;
                }
            ];
            const object = {
                hello: 'world'
            };
            let saved;
            const save = async function(theirs, ours) {
                await delay(50);
                saved = ours;
                return saved;
            };
            const buffer = AsyncSaveBuffer.acquire(state, {
                original: object,
                save,
            });
            buffer.assign({ hello: 'chicken' });
            expect(buffer.original).to.equal(object);
            expect(buffer.current).to.deep.equal({ hello: 'chicken' });
            expect(buffer.changed).to.be.true;
            expect(buffer.unsaved).to.be.true;

            let promise = buffer.save();
            expect(buffer.saving).to.be.true;
            await promise;
            expect(saved).to.deep.equal({ hello: 'chicken' });
            expect(buffer.saving).to.be.false;
            expect(buffer.unsaved).to.be.false;
            expect(buffer.changed).to.be.true;

            buffer.use({
                original: saved,
                save,
            });
            expect(buffer.original).to.equal(saved);
            expect(buffer.current).to.equal(saved);
            expect(buffer.changed).to.be.false;
        })
    })
    it ('should invoke prefill provided as param', async function() {
        const state = [
            {},
            function(v) { state[0] = v }
        ];
        const object = {
            hello: 'world'
        };
        const changes = {
            dingo: 'baby'
        };
        const prefill = (base) => {
            expect(base).to.equal(object);
            return changes;
        };
        const buffer = AsyncSaveBuffer.acquire(state, {
            original: object,
            prefill
        });
        expect(buffer.original).to.equal(object);
        expect(buffer.current).to.equal(changes);
        expect(buffer.changed).to.be.true;
        expect(buffer.unsaved).to.be.true;
    })
})
