const { log } = require('console');
const path = require('path');

module.exports = {
  entry: {
    contentScript: './src/content-script.js'
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  mode: 'production',
};
