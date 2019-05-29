import _ from 'lodash';
import { delay } from 'bluebird';
import React, { Component, useState } from 'react';
import { expect } from 'chai';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Relaks, {
    useProgress,
    useRenderEvent,
    usePreviousProps,
    useSaveBuffer,
    useEventTime,
    useErrorCatcher,
    useListener,
} from '../index';

configure({ adapter: new Adapter() });

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
            const wrapper = mount(<Test {...props} />);

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
            const wrapper = mount(<Test {...props} />);

            expect(wrapper.text()).to.equal('Initial');
            await delay(250);
            expect(wrapper.text()).to.equal('Done');
        })
        it ('should be able handle immediate availability of contents', async function() {
            const Test = Relaks.memo(async (props) => {
                const [ show ] = useProgress(100);
                show(<div>Done</div>);
            });

            // wrapper span is needed as Enzyme can't seem to handle the immediate update
            const props = {};
            const wrapper = mount(<span><Test {...props} /></span>);

            await delay(50);
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
            const wrapper = mount(<Test {...props} />);

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
            const wrapper = mount(<Test {...props} />);

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
            const wrapper = mount(<Boundary><Test {...props} /></Boundary>);

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
            const wrapper = mount(<Boundary><Test {...props} /></Boundary>);

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
            const wrapper = mount(<Test {...props} />);

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
            const wrapper = mount(<Test {...props} />);

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
            const wrapper = mount(<Test {...props} />);

            await delay(150);
            expect(wrapper.text()).to.equal('Done');
            expect(events).to.be.an('array').with.lengthOf(1);
            expect(events[0]).to.have.property('target');
            expect(events[0]).to.have.property('elapsed').that.is.above(100);
        })
    })
    describe('#usePreviousProps()', function() {
        it ('should retrieve previous set of props', async function() {
            const Test = Relaks.memo((props) => {
                const { text } = props;
                const { text: prevText } = usePreviousProps();
                const [ show ] = useProgress();
                show(
                    <div>
                        <div>Current: {text}</div>
                        {' '}
                        <div>Previous: {prevText}</div>
                    </div>
                );
            });

            const props = { text: 'Hello' };
            const wrapper = mount(<Test {...props} />);
            expect(wrapper.text()).to.equal('Current: Hello Previous: ');
            wrapper.setProps({ text: 'World' });
            await delay(50);
            expect(wrapper.text()).to.equal('Current: World Previous: Hello');
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
            const wrapper = mount(<Test {...props} />);
            expect(wrapper.find('input').prop('value')).to.equal(story.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: false');

            await delay(50);
            const changes = { title: 'Goodbye cruel world!' };
            draftRef.assign(changes);
            wrapper.update();
            expect(wrapper.find('input').prop('value')).to.equal(changes.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: true');

            await delay(150);
            expect(saved).to.have.property('title', changes.title);
            wrapper.setProps({ story: saved });
            await delay(50);
            expect(wrapper.find('#changed').text()).to.equal('Changed: false');
        })
        it ('should replace current value when there is are local changes', async function() {
            let draftRef;
            const Test = (props) => {
                const { story } = props;
                const draft = draftRef = useSaveBuffer({
                    original: story,
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
            const wrapper = mount(<Test {...props} />);
            expect(wrapper.find('input').prop('value')).to.equal(story.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: false');

            await delay(50);
            const storyAfter = { title: 'Dingo ate my baby!' };
            wrapper.setProps({ story: storyAfter });
            await delay(50);

            expect(wrapper.find('input').prop('value')).to.equal(storyAfter.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: false');
        })
        it ('should replace current value when there are local changes by default', async function() {
            let draftRef;
            const Test = (props) => {
                const { story } = props;
                const draft = draftRef = useSaveBuffer({
                    original: story,
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
            const wrapper = mount(<Test {...props} />);
            expect(wrapper.find('input').prop('value')).to.equal(story.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: false');

            await delay(50);
            const changes = { title: 'Goodbye cruel world!' };
            draftRef.assign(changes);
            wrapper.update();
            expect(wrapper.find('input').prop('value')).to.equal(changes.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: true');

            await delay(50);
            const storyAfter = { title: 'Dingo ate my baby!' };
            wrapper.setProps({ story: storyAfter });
            await delay(50);

            expect(wrapper.find('input').prop('value')).to.equal(storyAfter.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: false');
        })
        it ('should invoke merge() when there are local changes', async function() {
            let draftRef;
            const storyMerged = { title: 'Merged' };
            const Test = (props) => {
                const { story } = props;
                const draft = draftRef = useSaveBuffer({
                    original: story,
                    compare: _.isEqual,
                    merge: (base, ours, theirs) => {
                        expect(base.title).to.equal(storyBefore.title);
                        expect(ours.title).to.equal(changes.title);
                        expect(theirs.title).to.equal(storyAfter.title);
                        return storyMerged;
                    },
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

            const storyBefore = { title: 'Hello world' };
            const props = { story: storyBefore };
            const wrapper = mount(<Test {...props} />);
            expect(wrapper.find('input').prop('value')).to.equal(storyBefore.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: false');

            await delay(50);
            const changes = { title: 'Goodbye cruel world!' };
            draftRef.assign(changes);
            wrapper.update();
            expect(wrapper.find('input').prop('value')).to.equal(changes.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: true');

            await delay(50);
            const storyAfter = { title: 'Dingo ate my baby!' };
            wrapper.setProps({ story: storyAfter });
            await delay(50);

            expect(wrapper.find('input').prop('value')).to.equal(storyMerged.title);
            expect(wrapper.find('#changed').text()).to.equal('Changed: true');
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
            const wrapper = mount(<Test {...props} />);

            expect(wrapper.text()).to.equal('');
            func({ type: 'test' });
            expect(wrapper.text()).to.match(/^\d{4}-\d{2}-\d{2}/);
        })
    })
    describe('#useErrorCatcher()', function() {
        it ('should catch error from synchronous code', async function() {
            let test1, test2;
            const Test = (props) => {
                const [ error, run ] = useErrorCatcher();

                test1 = () => {
                    run(() => {
                        throw new Error('Error 1');
                    });
                };
                test2 = () => {
                    run(() => {
                        throw new Error('Error 2');
                    });
                };

                return <div>{error ? error.message : 'None'}</div>;
            };

            const wrapper = mount(<Test />);
            expect(wrapper.text()).to.equal('None');
            test1();
            expect(wrapper.text()).to.equal('Error 1');
            test2();
            expect(wrapper.text()).to.equal('Error 2');
        })
        it ('should catch error from asynchronous code', async function() {
            let test1, test2;
            const Test = (props) => {
                const [ error, run ] = useErrorCatcher();

                test1 = async () => {
                    await run(async () => {
                        throw new Error('Error 1');
                    });
                };
                test2 = async () => {
                    await run(async () => {
                        throw new Error('Error 2');
                    });
                };

                return <div>{error ? error.message : 'None'}</div>;
            };

            const wrapper = mount(<Test />);
            expect(wrapper.text()).to.equal('None');
            await test1();
            expect(wrapper.text()).to.equal('Error 1');
            await test2();
            expect(wrapper.text()).to.equal('Error 2');
        })
        it ('should return value from synchronous function', async function() {
            let test1, test2;
            const Test = (props) => {
                const [ error, run ] = useErrorCatcher();

                test1 = () => {
                    return run(() => 1);
                };
                test2 = () => {
                    return run(() => 2);
                };

                return <div>{error ? error.message : 'None'}</div>;
            };

            const wrapper = mount(<Test />);
            expect(wrapper.text()).to.equal('None');
            expect(test1()).to.equal(1);
            expect(test2()).to.equal(2);
        })
        it ('should return value from asynchronous function', async function() {
            let test1, test2;
            const Test = (props) => {
                const [ error, run ] = useErrorCatcher();

                test1 = () => {
                    return run(async () => 1);
                };
                test2 = () => {
                    return run(async () => {
                        await delay(50);
                        return 2;
                    });
                };

                return <div>{error ? error.message : 'None'}</div>;
            };

            const wrapper = mount(<Test />);
            expect(wrapper.text()).to.equal('None');
            expect(await test1()).to.equal(1);
            expect(await test2()).to.equal(2);
        })
    });
    describe('#useListener', function() {
        it ('should always return the same function', function() {
            let test;
            let counts = [];
            let funcs = [];
            const Test = (props) => {
                const [ count, setCount ] = useState(1);
                const f = useListener(() => {
                    counts.push(count);
                });

                test = () => {
                    f();
                    setCount(count + 1);
                };
                funcs.push(f);

                return <div>{count}</div>;
            };
            const wrapper = mount(<Test />);
            expect(wrapper.text()).to.equal('1');
            test();
            expect(wrapper.text()).to.equal('2');
            test();
            expect(wrapper.text()).to.equal('3');
            test();
            expect(counts).to.deep.equal([ 1, 2, 3 ]);
            expect(_.size(_.uniq(funcs))).to.equal(1);
        })
    });
})
