const Joi = require('joi');

const createStory = {
  body: Joi.object({
    image: Joi.string().uri().required(),
    text: Joi.string().allow('').max(150).optional(),
    textStyle: Joi.object({
      color: Joi.string().optional(),
      fontSize: Joi.number().min(12).max(60).optional(),
      position: Joi.object({
        x: Joi.number().min(0).max(100).optional(),
        y: Joi.number().min(0).max(100).optional(),
      }).optional(),
    }).optional(),
  }),
};

module.exports = { createStory };
