# babel-plugin-typescript-to-proptypes

A Babel plugin to generate React PropTypes from TypeScript interfaces or type aliases.

## Examples

Supports class components that define generic props.

```js
// Before
import React from 'react';

interface Props {
  name?: string;
}

class Example extends React.Component<Props> {
  render() {
    return <div />;
  }
}

// After
import React from 'react';
import PropTypes from 'prop-types';

class Example extends React.Component {
  static propTypes = {
    name: PropTypes.string,
  };

  render() {
    return <div />;
  }
}
```

Stateless function components that annotate the props argument.

```js
// Before
import React from 'react';

interface Props {
  name: string;
}

function Example(props: Props) {
  return <div />;
}

// After
import React from 'react';
import PropTypes from 'prop-types';

function Example(props) {
  return <div />;
}

Example.propTypes = {
  name: PropTypes.string.isRequired,
};
```

And anonymous functions that are annotated as a `React.SFC`.

```js
// Before
import React from 'react';

type Props = {
  name?: string,
};

const Example: React.SFC<Props> = props => <div />;

// After
import React from 'react';
import PropTypes from 'prop-types';

const Example = props => <div />;

Example.propTypes = {
  name: PropTypes.string,
};
```

## Requirements

- Babel 7
- TypeScript 2

## Installation

```js
yarn add --dev babel-plugin-typescript-to-proptypes
// Or
npm install --save-dev babel-plugin-typescript-to-proptypes
```

## Usage

Add the plugin to your Babel config. It's preferred to enable this plugin for development only.

```js
// babel.config.js
module.exports = function() {
  const plugins = [];

  if (process.env.NODE_ENV !== 'production') {
    plugins.push('babel-plugin-typescript-to-proptypes');
  }

  return {
    plugins,
  };
};
```
