import Promise from 'bluebird';
import { expect } from 'chai';
import PreactRenderSpy from 'preact-render-spy';
import Echo from './lib/echo';
import { h } from 'preact'
import Relaks, { AsyncComponent } from '../preact';

/** @jsx h */

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

describe('Error handler test', function() {
    it ('should be called when error occurs in synchronous code of async component', function() {
        let errorReceived;
        Relaks.set('errorHandler', (err) => {
            errorReceived = err;
        });
        let echo = new Echo();
        let wrapper = PreactRenderSpy.deep(<AsyncErrorComponent echo={echo} synchronous={true} />);
        expect(errorReceived).to.be.instanceof(Error);
    })
    it ('should be called when error occurs in synchronous code of async component', function() {
        let errorReceived;
        Relaks.set('errorHandler', (err) => {
            errorReceived = err;
        });
        let echo = new Echo();
        let wrapper = PreactRenderSpy.deep(<AsyncErrorComponent echo={echo} synchronous={false} />);
        expect(wrapper.text()).to.equal('Initial');
        return Promise.delay(250).then(() => {
            expect(errorReceived).to.be.instanceof(Error);
        });
    })
})
