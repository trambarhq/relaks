import Bluebird from 'bluebird';
import { expect } from 'chai';
import PreactRenderSpy from 'preact-render-spy';
import { h } from 'preact'
import Relaks, { AsyncComponent } from '../preact';

/** @jsx h */

describe('Error handler test', function() {
    // suppress Mocha's error handler during test
    let mochaErrorHandler;
    before(function() {
        mochaErrorHandler = window.onerror;
        window.onerror = null;
    });
    after(function() {
        window.onerror = mochaErrorHandler;
    });

    it ('should be called when error occurs in synchronous code of async component', function() {
        class Test extends AsyncComponent {
            renderAsync(meanwhile) {
                throw new Error('Synchronous error');
            }
        }

        let errorReceived;
        Relaks.set('errorHandler', (err) => {
            errorReceived = err;
        });
        const wrapper = PreactRenderSpy.deep(<Test />);

        expect(errorReceived).to.be.instanceof(Error);
    })
    it ('should be called when error occurs in synchronous code of async component', async function() {
        class Test extends AsyncComponent {
            renderAsync(meanwhile) {
                meanwhile.show(<div>Initial</div>, 'initial');
                return Bluebird.delay(100).then(() => {
                    throw new Error('Asynchronous error');
                });
            }
        }

        let errorReceived;
        Relaks.set('errorHandler', (err) => {
            errorReceived = err;
        });
        const wrapper = PreactRenderSpy.deep(<Test />);

        expect(wrapper.text()).to.equal('Initial');
        await Bluebird.delay(250);
        expect(errorReceived).to.be.instanceof(Error);
    })
})
