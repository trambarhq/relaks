var Promise = require('bluebird');
var React = require('react');
var Chai = require('chai'), expect = Chai.expect;
var Enzyme = require('enzyme');
var Echo = require('./lib/echo');
var Relaks = require('../relaks.js');

console.log(Relaks.Component)

class Test extends Relaks.Component {
    renderAsync(meanwhile) {
        meanwhile.show(<div>Initial</div>);
        return this.props.echo.return('data', 100, { test:1 }).then(() => {
            return <div>Done</div>;
        });
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
})
