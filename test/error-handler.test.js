import { delay } from 'bluebird';
import { h } from 'preact'
import { expect } from 'chai';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-preact-pure';

/** @jsx h */

import Relaks, { AsyncComponent } from '../src/preact.mjs';

describe('Error handler test', function() {
  // suppress Mocha's error handler during test
  let mochaErrorHandler;
  before(function() {
    mochaErrorHandler = window.onerror;
    window.onerror = null;
  })
  after(function() {
    window.onerror = mochaErrorHandler;
  })
  beforeEach(() => {
    configure({ adapter: new Adapter() });
  })

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
    const wrapper = mount(<Test />);

    expect(errorReceived).to.be.instanceof(Error);
  })
  it ('should be called when error occurs in synchronous code of async component', async function() {
    class Test extends AsyncComponent {
      async renderAsync(meanwhile) {
        meanwhile.show(<div>Initial</div>, 'initial');
        await delay(100);
        throw new Error('Asynchronous error');
      }
    }

    let errorReceived;
    Relaks.set('errorHandler', (err) => {
      errorReceived = err;
    });
    const wrapper = mount(<Test />);

    expect(wrapper.text()).to.equal('Initial');
    await delay(250);
    expect(errorReceived).to.be.instanceof(Error);
  })
})
