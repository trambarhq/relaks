import _ from 'lodash';
import Bluebird from 'bluebird';
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
        const buffer = AsyncSaveBuffer.get(state, {
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
            const buffer = AsyncSaveBuffer.get(state, {
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
            const buffer = AsyncSaveBuffer.get(state, {
                original: object,
                compare: _.isEqual,
            });
            const newObject = {
                hello: 'donut'
            };
            buffer.set(newObject);
            expect(buffer.changed).to.be.true;
            await Bluebird.delay(50);
            const newerObject = {
                hello: 'world'
            };
            buffer.set(newerObject);
            expect(buffer.changed).to.be.false;
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
            const buffer = AsyncSaveBuffer.get(state, {
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
            const buffer = AsyncSaveBuffer.get(state, {
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
            const buffer = AsyncSaveBuffer.get(state, {
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
            const buffer = AsyncSaveBuffer.get(state, {
                original: object,
                save: async function(theirs, ours) {
                    await Bluebird.delay(50);
                    saved = ours;
                },
                autosave: 50,
            });
            buffer.assign({ hello: 'chicken' });
            expect(buffer.original).to.equal(object);
            expect(buffer.current).to.deep.equal({ hello: 'chicken' });
            expect(buffer.changed).to.be.true;

            await Bluebird.delay(200);
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
            const buffer = AsyncSaveBuffer.get(state, {
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
    describe('#commit()', function() {
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
                await Bluebird.delay(50);
                saved = ours;
                return saved;
            };
            const buffer = AsyncSaveBuffer.get(state, {
                original: object,
                save,
            });
            buffer.assign({ hello: 'chicken' });
            expect(buffer.original).to.equal(object);
            expect(buffer.current).to.deep.equal({ hello: 'chicken' });
            expect(buffer.changed).to.be.true;

            let promise = buffer.commit();
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
            const buffer = AsyncSaveBuffer.get(state, {
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
            const buffer = AsyncSaveBuffer.get(state, {
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


        it ('should call set saving to false when the result shows up', async function() {
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
                await Bluebird.delay(50);
                saved = ours;
                return saved;
            };
            const buffer = AsyncSaveBuffer.get(state, {
                original: object,
                save,
            });
            buffer.assign({ hello: 'chicken' });
            expect(buffer.original).to.equal(object);
            expect(buffer.current).to.deep.equal({ hello: 'chicken' });
            expect(buffer.changed).to.be.true;

            let promise = buffer.commit();
            expect(buffer.saving).to.be.true;
            await promise;
            expect(saved).to.deep.equal({ hello: 'chicken' });
            expect(buffer.saving).to.be.true;

            buffer.use({
                original: saved,
                save,
            });
            expect(buffer.original).to.equal(saved);
            expect(buffer.current).to.equal(saved);
            expect(buffer.saving).to.be.false;
        })
    })
})
