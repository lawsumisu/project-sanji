import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { store } from 'src/editor/redux';
import { Editor } from 'src/editor/components';

class App extends React.Component {
  public render(): React.ReactNode {
    return (
      <Provider store={store}>
        <Editor/>
      </Provider>
    );
  }
}

ReactDOM.render(<App />, document.getElementById('root'));
