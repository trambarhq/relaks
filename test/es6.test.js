import Bluebird from 'bluebird';
import React from 'react';
import { expect } from 'chai';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import { AsyncComponent } from '../index';

Enzyme.configure({ adapter: new Adapter() });

describe('ES6 test', function() {
    it ('should render the component', function() {
        class Test extends AsyncComponent {
            renderAsync(meanwhile) {
                meanwhile.show(<div>Initial</div>, 'initial');
                return Bluebird.delay(100).then(() => {
                    return <div>Done</div>;
                });
            }
        }

        const wrapper = Enzyme.mount(<Test />);

        return Bluebird.try(() => {
            expect(wrapper.text()).to.equal('Initial');
            return Bluebird.delay(250).then(() => {
                expect(wrapper.text()).to.equal('Done');
            });
        });
    })
    it ('should use last progress when renderAsync() returns undefined', function() {
        class Test extends AsyncComponent {
            renderAsync(meanwhile) {
                meanwhile.show(<div>Initial</div>, 'initial');
                return Bluebird.delay(100).then(() => {
                    meanwhile.show(<div>Done</div>);
                });
            }
        }

        const wrapper = Enzyme.mount(<Test />);

        return Bluebird.try(() => {
            expect(wrapper.text()).to.equal('Initial');
            return Bluebird.delay(250).then(() => {
                expect(wrapper.text()).to.equal('Done');
            });
        });
    })
    it ('should call componentWillMount()', function() {
        class Test extends AsyncComponent {
            renderAsync(meanwhile) {
                meanwhile.show(<div>Initial</div>, 'initial');
                return Bluebird.delay(100).then(() => {
                    return <div>Done</div>;
                });
            }

            componentDidMount() {
                const { onMount } = this.props;
                this.setState({ mounted: true });
                if (onMount) {
                    onMount();
                }
            }
        }

        let mounted;
        const onMount = () => { mounted = true };
        const wrapper = Enzyme.mount(<Test onMount={onMount} />);

        expect(wrapper.state('mounted')).to.be.true;
        expect(mounted).to.be.true;
    })
    it ('should allow unmounting before rendering cycle finishes', function() {
        class Test extends AsyncComponent {
            renderAsync(meanwhile) {
                meanwhile.show(<div>Initial</div>, 'initial');
                return Bluebird.delay(100).then(() => {
                    return <div>Done</div>;
                });
            }

            componentDidMount() {
                const { onMount } = this.props;
                this.setState({ mounted: true });
                if (onMount) {
                    onMount();
                }
            }

            componentWillUnmount() {
                const { onUnmount } = this.props;
                super.componentWillUnmount();
                this.setState({ mounted: false });
                if (onUnmount) {
                    onUnmount();
                }
            }
        }

        let mounted;
        const onMount = () => { mounted = true };
        const onUnmount = () => { mounted = false };
        const wrapper = Enzyme.mount(<Test onMount={onMount} onUnmount={onUnmount} />);

        expect(wrapper.state('mounted')).to.be.true;
        expect(mounted).to.be.true;
        expect(wrapper.text()).to.equal('Initial');
        wrapper.unmount();
        expect(mounted).to.be.false;
    })
})
