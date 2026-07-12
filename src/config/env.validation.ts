import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),
  DB_DATABASE: Joi.string().required(),
  DB_POOL_SIZE: Joi.number().default(10),

  RABBITMQ_URI: Joi.string().uri().required(),
  RABBITMQ_PREFETCH_COUNT: Joi.number().default(10),

  REDIS_URI: Joi.string()
    .uri({ scheme: ['redis', 'rediss'] })
    .required(),

  JWT_SECRET: Joi.string().min(16).required(),

  CORS_ORIGIN: Joi.string().default('*'),
});
