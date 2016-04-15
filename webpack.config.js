module.exports = {
    entry: [
        './index'
    ],
    output: {
        path: 'dist/',
        filename: 'index.js',
        libraryTarget: 'commonjs',
    },
    externals: ['fs', 'path', 'request', 'lodash', 'html-entities', 'amazon-sitb'],
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel'
            }
        ]
    }
}
