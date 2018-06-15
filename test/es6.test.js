var Promise = require('bluebird');
var React = require('react');
var Chai = require('chai'), expect = Chai.expect;
var Enzyme = require('enzyme');
var Echo = require('./lib/echo');
var Relaks = require('../index');

class Test extends Relaks.Component {
    renderAsync(meanwhile) {
        meanwhile.blank(false);
        meanwhile.show(<div>Initial</div>);
        return this.props.echo.return('data', { test:1 }, 100).then(() => {
            return <div>Done</div>;
        });
    }

    componentWillMount() {
        super.componentWillMount();
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
        var echo = new Echo();
        var wrapper = Enzyme.mount(<Test echo={echo}/>);

        return Promise.try(() => {
            expect(wrapper.text()).to.equal('Initial');
            return Promise.delay(250).then(() => {
                expect(wrapper.text()).to.equal('Done');
            });
        });
    })
    it ('should call componentWillMount()', function() {
        var echo = new Echo();
        var mounted;
        var onMount = () => { mounted = true };
        var wrapper = Enzyme.mount(<Test echo={echo} onMount={onMount} />);
        expect(wrapper.state('mounted')).to.be.true;
        expect(mounted).to.be.true;
    })
    it ('should allow unmounting before rendering cycle finishes', function() {
        var echo = new Echo();
        var mounted;
        var onMount = () => { mounted = true };
        var onUnmount = () => { mounted = false };
        var wrapper = Enzyme.mount(<Test echo={echo} onMount={onMount} onUnmount={onUnmount} />);
        expect(wrapper.state('mounted')).to.be.true;
        expect(mounted).to.be.true;
        wrapper.unmount();
        expect(mounted).to.be.false;
    })
})
