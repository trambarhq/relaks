import Bluebird from 'bluebird';
import { expect } from 'chai';
import PreactRenderSpy from 'preact-render-spy';
import { h } from 'preact'
import { AsyncComponent } from '../preact';

/** @jsx h */

describe('Await test', function() {
    it ('should render the component', async function() {
        class Test extends AsyncComponent {
            async renderAsync(meanwhile, props) {
                meanwhile.show(<div>Initial</div>, 'initial');
                await Bluebird.delay(100);
                return <div>Done</div>;
            }
        }

        var wrapper = PreactRenderSpy.deep(<Test />);

        expect(wrapper.text()).to.equal('Initial');
        await Bluebird.delay(250);
        expect(wrapper.text()).to.equal('Done');
    })
})
