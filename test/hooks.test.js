import _ from 'lodash';
import Bluebird from 'bluebird';
import React from 'react';
import { expect } from 'chai';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Relaks, { useProgress, useRenderEvent, usePreviousProps, useSaveBuffer } from '../index';

Enzyme.configure({ adapter: new Adapter() });

describe('Hooks', function() {
    describe('#useProgress()', function() {
        it ('should render the component', async function() {
            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress();

                show(<div>Initial</div>, 'initial');
                await Bluebird.delay(100);
                return <div>Done</div>;
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            expect(wrapper.text()).to.equal('Initial');
            await Bluebird.delay(250);
            expect(wrapper.text()).to.equal('Done');
        })
        it ('should show last progress when undefined is returned', async function() {
            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress();

                show(<div>Initial</div>, 'initial');
                await Bluebird.delay(100);
                show(<div>Done</div>);
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            expect(wrapper.text()).to.equal('Initial');
            await Bluebird.delay(250);
            expect(wrapper.text()).to.equal('Done');
        })
        it ('should not render progress when promise resolve quickly', async function() {
            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress(200);

                show(<div>Initial</div>, 'initial');
                await Bluebird.delay(25);
                show(<div>Progress</div>);
                await Bluebird.delay(50);
                show(<div>Done</div>);
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            expect(wrapper.text()).to.be.equal('Initial');
            await Bluebird.delay(150);
            expect(wrapper.text()).to.equal('Done');
        })
        it ('should render progress when promise resolve slowly', async function() {
            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress(50);

                show(<div>Initial</div>, 'initial');
                await Bluebird.delay(25);
                show(<div>Progress</div>);
                await Bluebird.delay(100);
                show(<div>Done</div>);
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            expect(wrapper.text()).to.be.equal('Initial');
            await Bluebird.delay(75);
            expect(wrapper.text()).to.be.equal('Progress');
            await Bluebird.delay(150);
            expect(wrapper.text()).to.equal('Done');
        })
    }) 
    describe('#useRenderEvent()', function() {
        it ('should fire progress event', async function() {
            const events = [];
            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress(50);

                useRenderEvent('progress', (evt) => {
                    events.push(evt);
                });

                show(<div>Initial</div>, 'initial');
                await Bluebird.delay(25);
                show(<div>Progress</div>);
                await Bluebird.delay(100);
                show(<div>Done</div>);
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            await Bluebird.delay(150);
            expect(wrapper.text()).to.equal('Done');
            expect(events).to.be.an('array').with.lengthOf(3);
            expect(events[1]).to.have.property('target');
            expect(events[1]).to.have.property('elapsed').that.is.above(20);
        })
        it ('should fire complete event when undefined is returned', async function() {
            const events = [];
            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress(50);

                useRenderEvent('complete', (evt) => {
                    events.push(evt);
                });

                show(<div>Initial</div>, 'initial');
                await Bluebird.delay(25);
                show(<div>Progress</div>);
                await Bluebird.delay(100);
                show(<div>Done</div>);
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            await Bluebird.delay(150);
            expect(wrapper.text()).to.equal('Done');
            expect(events).to.be.an('array').with.lengthOf(1);
            expect(events[0]).to.have.property('target');
            expect(events[0]).to.have.property('elapsed').that.is.above(100);
        })
        it ('should fire complete event when an element is returned', async function() {
            const events = [];
            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress(50);

                useRenderEvent('complete', (evt) => {
                    events.push(evt);
                });

                show(<div>Initial</div>, 'initial');
                await Bluebird.delay(25);
                show(<div>Progress</div>);
                await Bluebird.delay(100);
                return <div>Done</div>;
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            await Bluebird.delay(150);
            expect(wrapper.text()).to.equal('Done');
            expect(events).to.be.an('array').with.lengthOf(1);
            expect(events[0]).to.have.property('target');
            expect(events[0]).to.have.property('elapsed').that.is.above(100);
        })
    })
    describe('#usePreviousProps()', function() {
        it ('should retrieve previous set of props', async function() {
            /* waiting for hook support */
        })
    })
    describe('#useSaveBuffer()', function() {
        it ('should update value in input field', async function() {
            let saved;
            let draftRef;
            const Test = (props) => {
                const { story } = props;
                const draft = draftRef = useSaveBuffer({
                    original: story,
                    save: (base, ours) => {
                        saved = ours;
                        return _.clone(ours);
                    },
                    compare: _.isEqual,
                    autosave: 100,
                });
                const handleChange = (evt) => {
                    draft.assign({ title: evt.target.value });
                };
                return (
                    <div>
                        <input value={draft.current.title} onChange={handleChange} />
                        <div id="changed">Changed: {draft.changed + ''}</div>
                    </div>
                );
            };

            const story = { title: 'Hello world' };
            const props = { story };
            const wrapper = Enzyme.mount(<Test {...props} />);
            expect(wrapper.find('input').prop('value')).to.equal(story.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: false');

            await Bluebird.delay(50);
            const changes = { title: 'Goodbye cruel world!' };
            draftRef.assign(changes);
            await Bluebird.delay(50);

            wrapper.update();
            expect(wrapper.find('input').prop('value')).to.equal(changes.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: true');

            await Bluebird.delay(150);
            expect(saved).to.have.property('title', changes.title);
            wrapper.setProps({ story: saved });
            await Bluebird.delay(50);
            expect(wrapper.find('#changed').text()).to.equal('Changed: false');
        })
    })
})
