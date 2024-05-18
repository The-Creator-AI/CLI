const path = require('path');

module.exports = {
  entry: './src/index.ts',
  mode: 'production', // Set to 'development' for source maps in dev mode
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      name: 'myLib', // Your library's name
      type: 'umd', // Universal Module Definition (for browser & Node.js)
      export: 'default' // Specifies the default export
    },
    globalObject: 'this' // For compatibility with older browsers
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  externals: { // Exclude dependencies from the bundle
    'lodash': 'lodash' // Replace with your actual dependencies
  },
  devtool: 'source-map' // Enable source maps
};
