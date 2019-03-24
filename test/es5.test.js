var Bluebird = require('bluebird');
var React = require('react');
var Chai = require('chai'), expect = Chai.expect;
var Enzyme = require('enzyme');
var Adapter = require('enzyme-adapter-react-16');
var Relaks = require('../index');

React.createClass = require('create-react-class');
Relaks.createClass = require('../create-class');

Enzyme.configure({ adapter: new Adapter() });

describe('ES5 test', function() {
    var Test = Relaks.createClass({
        renderAsync: function(meanwhile) {
            meanwhile.show(<div>Initial</div>, 'initial');
            return Bluebird.delay(100).then(() => {
                return <div>Done</div>;
            });
        },

        componentDidMount: function() {
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

    it ('should render the component', function() {
        var wrapper = Enzyme.mount(<Test />);

        return Bluebird.try(() => {
            expect(wrapper.text()).to.equal('Initial');
            return Bluebird.delay(250).then(() => {
                expect(wrapper.text()).to.equal('Done');
            });
        });
    })
    it ('should call componentWillMount()', function() {
        var mounted;
        var onMount = () => { mounted = true };
        var wrapper = Enzyme.mount(<Test onMount={onMount} />);
        expect(wrapper.state('mounted')).to.be.true;
        expect(mounted).to.be.true;
    })
    it ('should allow unmounting before rendering cycle finishes', function() {
        var mounted;
        var onMount = () => { mounted = true };
        var onUnmount = () => { mounted = false };
        var wrapper = Enzyme.mount(<Test onMount={onMount} onUnmount={onUnmount} />);
        expect(wrapper.state('mounted')).to.be.true;
        expect(mounted).to.be.true;
        wrapper.unmount();
        expect(mounted).to.be.false;
    })
})
