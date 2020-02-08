import { delay } from 'bluebird';
import { h } from 'preact'
import { expect } from 'chai';
import { configure, mount } from 'enzyme';
import Adapter from 'enzyme-adapter-preact-pure';

/** @jsx h */

import { AsyncComponent } from '../src/preact.mjs';

configure({ adapter: new Adapter() });

describe('AsyncComponent (Preact)', function() {
  it ('should render the component', async function() {
    class Test extends AsyncComponent {
      async renderAsync(meanwhile, props) {
        const { text } = props;
        meanwhile.show(<div>Initial</div>, 'initial');
        await delay(100);
        return <div>{text}</div>;
      }
    }

    const wrapper = mount(<Test text="Done" />);

    expect(wrapper.text()).to.equal('Initial');
    await delay(250);
    expect(wrapper.text()).to.equal('Done');
  })
  it ('should call componentWillMount()', async function() {
    class Test extends AsyncComponent {
      async renderAsync(meanwhile, props) {
        meanwhile.show(<div>Initial</div>, 'initial');
        await delay(100);
        return <div>Done</div>;
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
    const wrapper = mount(<Test onMount={onMount} />);
    expect(wrapper.state('mounted')).to.be.true;
    expect(mounted).to.be.true;
  })
  it ('should allow unmounting before rendering cycle finishes', async function() {
    class Test extends AsyncComponent {
      async renderAsync(meanwhile, props) {
        meanwhile.show(<div>Initial</div>, 'initial');
        await delay(100);
        return <div>Done</div>;
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
    const wrapper = mount(<Test onMount={onMount} onUnmount={onUnmount} />);
    expect(wrapper.state('mounted')).to.be.true;
    expect(mounted).to.be.true;
    wrapper.render(null);
    expect(mounted).to.be.false;
  })
})
