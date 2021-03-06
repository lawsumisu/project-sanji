import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from 'src/editor/redux';
import { Root } from 'src/editor/components';
import { initializeFontAwesome } from 'src/editor/utilities/fontAwesome.util';

initializeFontAwesome();

class App extends React.Component {
  public render(): React.ReactNode {
    return (
      <Provider store={store}>
        <Root />
      </Provider>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
