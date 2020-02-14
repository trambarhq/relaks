import { delay } from 'bluebird';
import React, { Component } from 'react';
import Chai, { expect } from 'chai';
import ChaiSpies from 'chai-spies'; Chai.use(ChaiSpies);
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';

import Relaks, { AsyncComponent, useProgress } from '../react.mjs';

class Boundary extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    const { children } = this.props;
    const { error } = this.state;
    if (error) {
      return error.message;
    } else {
      return children;
    }
  }
}

describe('Error boundary test', function() {
  beforeEach(function() {
    configure({ adapter: new Adapter() });

    // suppress Mocha's error handler during test
    Chai.spy.on(window, 'onerror', () => {});
    Chai.spy.on(console, 'error', () => {});
  })
  afterEach(function() {
    Chai.spy.restore();
  })
  it ('should catch error in synchronous code', function() {
    class Test extends Component {
      render() {
        throw new Error('Synchronous error');
      }
    }
    const wrapper = mount(<Boundary><Test /></Boundary>);
    expect(wrapper.text()).to.equal('Synchronous error');
  })
  it ('should catch error in synchronous code of async component', function() {
    class Test extends AsyncComponent {
      renderAsync(meanwhile) {
        throw new Error('Synchronous error');
      }
    }
    const wrapper = mount(<Boundary><Test /></Boundary>);
    expect(wrapper.text()).to.equal('Synchronous error');
  })
  it ('should catch error in asynchronous code', async function() {
    class Test extends AsyncComponent {
      async renderAsync(meanwhile) {
        meanwhile.show(<div>Initial</div>, 'initial');
        await delay(100);
        throw new Error('Asynchronous error');
      }
    }

    const wrapper = mount(<Boundary><Test /></Boundary>);
    expect(wrapper.text()).to.equal('Initial');
    await update(wrapper, 250);
    expect(wrapper.text()).to.equal('Asynchronous error');
  })
  it ('should catch error in functional component', function() {
    function Test() {
      throw new Error('Synchronous error');
    }

    const wrapper = mount(<Boundary><Test /></Boundary>);
    expect(wrapper.text()).to.equal('Synchronous error');
  })
  it ('should catch error in async functional component', async function() {
    const Test = Relaks.memo(async function() {
      const [ show ] = useProgress();
      throw new Error('Asynchronous error');
    });

    const wrapper = mount(<Boundary><Test /></Boundary>);
    await update(wrapper, 50);
    expect(wrapper.text()).to.equal('Asynchronous error');
  })
})

async function update(wrapper, ms) {
  await delay(ms);
  wrapper.update();
}
