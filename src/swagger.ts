import swaggerJSDoc from "swagger-jsdoc";

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Moderation API',
            version: '1.0.0',
            description: 'AI-powered content moderation API'
        }
    },
    apis: ['./src/routes/*.ts']
};

export const swaggerSpec = swaggerJSDoc(options)