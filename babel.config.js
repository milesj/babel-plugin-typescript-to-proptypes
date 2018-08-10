module.exports = {
  babelrc: false,
  comments: false,
  ignore: ['tests/fixtures'],
  sourceType: 'unambiguous',
  presets: [['@babel/preset-env', { targets: { node: '8.9' } }], '@babel/preset-react'],
};
