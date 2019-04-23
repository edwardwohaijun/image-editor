import React, {Component} from 'react';
class Account extends Component {
  constructor(props) {
    super(props);
    this.state = { };
    this.span = null;
  }

  render() {
    return (
        <div>
          {/*<span style={{color: '#FFF'}} ref={span => this.span = span} /> */}
          <div>login/signup</div>
        </div>
    )}
}

export default Account;
