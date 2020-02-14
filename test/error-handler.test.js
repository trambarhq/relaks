import { delay } from 'bluebird';
import { h } from 'preact'
import Chai, { expect } from 'chai';
import ChaiSpies from 'chai-spies'; Chai.use(ChaiSpies);
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-preact-pure';

/** @jsx h */

import Relaks, { AsyncComponent } from '../preact.mjs';

describe('Error handler test', function() {
  beforeEach(function() {
    configure({ adapter: new Adapter() });

    // suppress Mocha's error handler during test
    Chai.spy.on(window, 'onerror', () => {});
    Chai.spy.on(console, 'error', () => {});
  })
  afterEach(function() {
    Chai.spy.restore();
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
