var Promise = require('bluebird');
var React = require('react');
var Chai = require('chai'), expect = Chai.expect;
var Enzyme = require('enzyme');
var Echo = require('./lib/echo');
var Relaks = require('../index');

var Test = Relaks.createClass({
    renderAsync: function(meanwhile) {
        meanwhile.show(<div>Initial</div>);
        return this.props.echo.return('data', 100, { test:1 }).then(() => {
            return <div>Done</div>;
        });
    },

    componentWillMount: function() {
        this.setState({ mounted: true });
        if (this.props.onMount) {
            this.props.onMount();
        }
    },

    componentWillUnmount: function() {
        this.setState({ mounted: false });
        if (this.props.onUnmount) {
            this.props.onUnmount();
        }
    },
});

describe('ES5 test', function() {
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
