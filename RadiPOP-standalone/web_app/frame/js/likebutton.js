'use strict';

const e = React.createElement;

class LikeButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = { liked: false };
  }

  render() {
    if (this.state.liked) {
      return 'You liked this React Component.';
    }

    return e(
      'button',
      { onClick: () => this.setState({ liked: true }) },
      'Like (Press)'
    );
  }
}
const domContainer = document.querySelector('#like-button');
ReactDOM.render(e(LikeButton), domContainer);

