import Promise from 'bluebird';
import React from 'react';
import { expect } from 'chai';
import Enzyme from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Echo from './lib/echo';
import Relaks from '../index';

Enzyme.configure({ adapter: new Adapter() });

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    render() {
        if (this.state.error) {
            return this.state.error.message;
        }
        return this.props.children;
    }

    componentDidCatch(error, info) {
        this.setState({ error });
    }
}

class AsyncErrorComponent extends Relaks.Component {
    renderAsync(meanwhile) {
        if (this.props.synchronous) {
            throw new Error('Synchronous error');
        }
        meanwhile.show(<div>Initial</div>, 'initial');
        return this.props.echo.return('data', { test:1 }, 100).then(() => {
            throw new Error('Asynchronous error');
        });
    }
}

class SyncErrorComponent extends React.Component {
    render() {
        throw new Error('Synchronous error');
    }
}

describe('Error boundary test', function() {
    before(function() {
        // Enzyme doesn't seem to work correctly with componentDidCatch()
        // will need to checke behavior in real-world code
        this.skip();
    })
    it ('should catch error in synchronous code', function() {
        let wrapper = Enzyme.mount(
            <ErrorBoundary>
                <SyncErrorComponent />
            </ErrorBoundary>
        );
        expect(wrapper.text()).to.equal('Synchronous error');
    })
    it ('should catch error in synchronous code of async component', function() {
        let echo = new Echo();
        let wrapper = Enzyme.mount(
            <ErrorBoundary>
                <AsyncErrorComponent echo={echo} synchronous={true} />
            </ErrorBoundary>
        );
        expect(wrapper.text()).to.equal('Synchronous error');
    })
    it ('should catch error in asynchronous code', function() {
        let echo = new Echo();
        let wrapper = Enzyme.mount(
            <ErrorBoundary>
                <AsyncErrorComponent echo={echo} synchronous={false} />
            </ErrorBoundary>
        );
        return Promise.try(() => {
            expect(wrapper.text()).to.equal('Initial');
            return Promise.delay(250).then(() => {
                expect(wrapper.text()).to.equal('Asynchronous error');
            });
        });
    })
})
