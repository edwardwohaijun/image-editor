import React, {Component} from 'react';
class Account extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
    this.span = null;
  }

  onMoueMove = evt => {
    this.span.innerText = 'x: ' + evt.pageX + ', y: ' + evt.pageY
  };

  componentDidMount = () => {
    // window.addEventListener('mousemove', this.onMoueMove)
  };

  componentDidUpdate = () => {


  };

  render() {
    return (
        <div>
          {/*<span style={{color: '#FFF'}} ref={span => this.span = span} /> */}
          <div>replace me with a Github icon</div>
        </div>
    )}
}

export default Account;
