import Bluebird from 'bluebird';
import { expect } from 'chai';
import PreactRenderSpy from 'preact-render-spy';
import Echo from './lib/echo';
import { h } from 'preact'
import { AsyncComponent } from '../preact';

/** @jsx h */

class Test extends AsyncComponent {
    async renderAsync(meanwhile, props) {
        meanwhile.show(<div>Initial</div>, 'initial');
        let data = await props.echo.return('data', { test:1 }, 100);
        return <div>Done</div>;
    }

    componentWillMount() {
        this.setState({ mounted: true });
        if (this.props.onMount) {
            this.props.onMount();
        }
    }

    componentWillUnmount() {
        super.componentWillUnmount();
        this.setState({ mounted: false });
        if (this.props.onUnmount) {
            this.props.onUnmount();
        }
    }
}

describe('Await test', function() {
    it ('should render the component', async function() {
        var echo = new Echo();
        var wrapper = PreactRenderSpy.deep(<Test echo={echo}/>);

        expect(wrapper.text()).to.equal('Initial');
        await Bluebird.delay(250);
        expect(wrapper.text()).to.equal('Done');
    })
    it ('should call componentWillMount()', function() {
        var echo = new Echo();
        var mounted;
        var onMount = () => { mounted = true };
        var wrapper = PreactRenderSpy.deep(<Test echo={echo} onMount={onMount} />);
        expect(wrapper.state('mounted')).to.be.true;
        expect(mounted).to.be.true;
    })
    it ('should allow unmounting before rendering cycle finishes', function() {
        var echo = new Echo();
        var mounted;
        var onMount = () => { mounted = true };
        var onUnmount = () => { mounted = false };
        var wrapper = PreactRenderSpy.deep(<Test echo={echo} onMount={onMount} onUnmount={onUnmount} />);
        expect(wrapper.state('mounted')).to.be.true;
        expect(mounted).to.be.true;
        wrapper.render(null);
        expect(mounted).to.be.false;
    })
})
