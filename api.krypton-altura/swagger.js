const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output.json'
const endpointsFiles = ['./entry.js']

swaggerAutogen(outputFile, endpointsFiles).then(() => {
    require('./entry.js')
})