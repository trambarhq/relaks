import Bluebird from 'bluebird';
import React from 'react';
import { expect } from 'chai';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Echo from './lib/echo';
import Relaks, { useProgress, useRenderEvent, usePreviousProps, useSaveBuffer } from '../hooks';

Enzyme.configure({ adapter: new Adapter() });

describe('Hooks test', function() {
    describe('#useProgress()', function() {
        it ('should render the component', async function() {
            const Test = Relaks(async (props) => {
                const { echo } = props;
                const [ show ] = useProgress();

                show(<div>Initial</div>, 'initial');
                await echo.return('data', { test:1 }, 100);
                show(<div>Done</div>);
            });

            const props = { echo: new Echo };
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            expect(wrapper.text()).to.equal('Initial');
            await Bluebird.delay(250);
            expect(wrapper.text()).to.equal('Done');
        })

        it ('should not render progress when promise resolve quickly', async function() {
            const Test = Relaks(async (props) => {
                const { echo } = props;
                const [ show ] = useProgress(200);

                show(<div>Initial</div>, 'initial');
                await echo.return('data1', { test:1 }, 25);
                show(<div>Progress</div>);
                await echo.return('data2', { test:2 }, 50);
                show(<div>Done</div>);
            });

            const props = { echo: new Echo };
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            expect(wrapper.text()).to.be.equal('Initial');
            await Bluebird.delay(150);
            expect(wrapper.text()).to.equal('Done');
        })
        it ('should render progress when promise resolve slowly', async function() {
            const Test = Relaks(async (props) => {
                const { echo } = props;
                const [ show ] = useProgress(50);

                show(<div>Initial</div>, 'initial');
                await echo.return('data1', { test:1 }, 25);
                show(<div>Progress</div>);
                await echo.return('data2', { test:2 }, 100);
                show(<div>Done</div>);
            });

            const props = { echo: new Echo };
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
            const Test = Relaks(async (props) => {
                const { echo } = props;
                const [ show ] = useProgress(50);

                useRenderEvent('progress', (evt) => {
                    events.push(evt);
                });

                show(<div>Initial</div>, 'initial');
                await echo.return('data1', { test:1 }, 25);
                show(<div>Progress</div>);
                await echo.return('data2', { test:2 }, 100);
                show(<div>Done</div>);
            });

            const props = { echo: new Echo };
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            await Bluebird.delay(150);
            expect(wrapper.text()).to.equal('Done');
            expect(events).to.be.an('array').with.lengthOf(3);
            expect(events[1]).to.have.property('target');
            expect(events[1]).to.have.property('elapsed').that.is.above(20);
        })
        it ('should fire complete event', async function() {
            const events = [];
            const Test = Relaks(async (props) => {
                const { echo } = props;
                const [ show ] = useProgress(50);

                useRenderEvent('complete', (evt) => {
                    events.push(evt);
                });

                show(<div>Initial</div>, 'initial');
                await echo.return('data1', { test:1 }, 25);
                show(<div>Progress</div>);
                await echo.return('data2', { test:2 }, 100);
                show(<div>Done</div>);
            });

            const props = { echo: new Echo };
            const wrapper = Enzyme.mount(<span><Test {...props} /></span>);

            await Bluebird.delay(150);
            expect(wrapper.text()).to.equal('Done');
            expect(events).to.be.an('array').with.lengthOf(1);
            expect(events[1]).to.have.property('target');
            expect(events[1]).to.have.property('elapsed').that.is.above(100);
        })
    })
    describe('#usePreviousProps()', function() {
        it ('should retrieve previous set of props', async function() {
            /* waiting for hook support */
        })
    })
})
