import _ from 'lodash';
import { delay } from 'bluebird';
import React, { Component } from 'react';
import { expect } from 'chai';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Relaks, { useProgress, useRenderEvent, usePreviousProps, useSaveBuffer, useEventTime } from '../index';

Enzyme.configure({ adapter: new Adapter() });

describe('Hooks', function() {
    describe('#useProgress()', function() {
        it ('should render the component', async function() {
            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress();

                show(<div>Initial</div>, 'initial');
                await delay(100);
                return <div>Done</div>;
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            expect(wrapper.text()).to.equal('Initial');
            await delay(250);
            expect(wrapper.text()).to.equal('Done');
        })
        it ('should show last progress when undefined is returned', async function() {
            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress();

                show(<div>Initial</div>, 'initial');
                await delay(100);
                show(<div>Done</div>);
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            expect(wrapper.text()).to.equal('Initial');
            await delay(250);
            expect(wrapper.text()).to.equal('Done');
        })
        it ('should not render progress when promise resolve quickly', async function() {
            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress(200);

                show(<div>Initial</div>, 'initial');
                await delay(25);
                show(<div>Progress</div>);
                await delay(50);
                show(<div>Done</div>);
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            expect(wrapper.text()).to.be.equal('Initial');
            await delay(150);
            expect(wrapper.text()).to.equal('Done');
        })
        it ('should render progress when promise resolve slowly', async function() {
            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress(50);

                show(<div>Initial</div>, 'initial');
                await delay(25);
                show(<div>Progress</div>);
                await delay(100);
                show(<div>Done</div>);
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            expect(wrapper.text()).to.be.equal('Initial');
            await delay(75);
            expect(wrapper.text()).to.be.equal('Progress');
            await delay(150);
            expect(wrapper.text()).to.equal('Done');
        })
        it ('should throw an error when show() is not called', async function () {
            // suppress Mocha's error handler during test
            let mochaErrorHandler = window.onerror;
            window.onerror = null;

            class Boundary extends Component {
                constructor(props) {
                    super(props);
                    this.state = {};
                }

                static getDerivedStateFromError(error) {
                    return { error };
                }

                render() {
                    const { children } = this.props;
                    const { error } = this.state;
                    if (error) {
                        return 'ERROR';
                    } else {
                        return children;
                    }
                }
            }

            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress(50);

                await delay(25);
                show(<div>Progress</div>);
                await delay(50);
                show(<div>Done</div>);
            });

            const props = {};
            const wrapper = Enzyme.mount(<Boundary><Test {...props} /></Boundary>);

            await delay(100);
            window.onerror = mochaErrorHandler;
            expect(wrapper.text()).to.equal('ERROR');
        })
        it ('should error thrown prior to show() to get through', async function () {
            // suppress Mocha's error handler during test
            let mochaErrorHandler = window.onerror;
            window.onerror = null;

            class Boundary extends Component {
                constructor(props) {
                    super(props);
                    this.state = {};
                }

                static getDerivedStateFromError(error) {
                    return { error };
                }

                render() {
                    const { children } = this.props;
                    const { error } = this.state;
                    if (error) {
                        return error.message;
                    } else {
                        return children;
                    }
                }
            }

            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress(50);

                throw new Error('Early error');
                show(<div>Initial</div>, 'initial');
                await delay(25);
                show(<div>Progress</div>);
                await delay(50);
                show(<div>Done</div>);
            });

            const props = {};
            const wrapper = Enzyme.mount(<Boundary><Test {...props} /></Boundary>);

            await delay(100);
            window.onerror = mochaErrorHandler;
            expect(wrapper.text()).to.equal('Early error');
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
                await delay(25);
                show(<div>Progress</div>);
                await delay(100);
                show(<div>Done</div>);
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            await delay(150);
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
                await delay(25);
                show(<div>Progress</div>);
                await delay(100);
                show(<div>Done</div>);
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            await delay(150);
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
                await delay(25);
                show(<div>Progress</div>);
                await delay(100);
                return <div>Done</div>;
            });

            const props = {};
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            await delay(150);
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

            await delay(50);
            const changes = { title: 'Goodbye cruel world!' };
            draftRef.assign(changes);
            await delay(50);

            wrapper.update();
            expect(wrapper.find('input').prop('value')).to.equal(changes.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: true');

            await delay(150);
            expect(saved).to.have.property('title', changes.title);
            wrapper.setProps({ story: saved });
            await delay(50);
            expect(wrapper.find('#changed').text()).to.equal('Changed: false');
        })
    })
    describe('#useEventTime()', function() {
        it ('should set the time when the handler is called', async function() {
            let func;
            const Test = (props) => {
                const [ date, setDate ] = useEventTime();
                func = setDate;
                return <div>{date ? date.toISOString() : ''}</div>;
            };
            const props = {};
            const wrapper = Enzyme.mount(<Test {...props} />);

            expect(wrapper.text()).to.equal('');
            func({ type: 'test' });
            expect(wrapper.text()).to.match(/^\d{4}-\d{2}-\d{2}/);
        })
    })
})
