import Promise from 'bluebird';
import React from 'react';
import { expect } from 'chai';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Echo from './lib/echo';
import Relaks from '../index';

Enzyme.configure({ adapter: new Adapter() });

class Test extends Relaks.Component {
    renderAsync(meanwhile) {
        meanwhile.show(<div>Initial</div>, 'initial');
        return this.props.echo.return('data', { test:1 }, 100).then(() => {
            return <div>Done</div>;
        });
    }

    componentDidMount() {
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

describe('ES6 test', function() {
    it ('should render the component', function() {
        let echo = new Echo();
        let wrapper = Enzyme.mount(<Test echo={echo}/>);

        return Promise.try(() => {
            expect(wrapper.text()).to.equal('Initial');
            return Promise.delay(250).then(() => {
                expect(wrapper.text()).to.equal('Done');
            });
        });
    })
    it ('should call componentWillMount()', function() {
        let echo = new Echo();
        let mounted;
        let onMount = () => { mounted = true };
        let wrapper = Enzyme.mount(<Test echo={echo} onMount={onMount} />);
        expect(wrapper.state('mounted')).to.be.true;
        expect(mounted).to.be.true;
    })
    it ('should allow unmounting before rendering cycle finishes', function() {
        let echo = new Echo();
        let mounted;
        let onMount = () => { mounted = true };
        let onUnmount = () => { mounted = false };
        let wrapper = Enzyme.mount(<Test echo={echo} onMount={onMount} onUnmount={onUnmount} />);
        expect(wrapper.state('mounted')).to.be.true;
        expect(mounted).to.be.true;
        wrapper.unmount();
        expect(mounted).to.be.false;
    })
})
