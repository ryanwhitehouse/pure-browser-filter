const merge = require('webpack-merge')
const common = require('./webpack.common.js')
// const ChromeExtensionReloader = require('webpack-chrome-extension-reloader')

module.exports = merge(common, {
    devtool: 'inline-source-map',
    mode: 'development',
    watch: true,
    watchOptions: {
        ignored: ['node_modules/**']
    }
})
