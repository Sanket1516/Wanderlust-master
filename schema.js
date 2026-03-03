//we have installed it first
//required joi package 
const joi = require("joi");

//write any name of the validate schema
//joi.object tells it will  take one object as a argument
const listingSchema = joi.object({
  listing: joi.object({
    title: joi.string().required(),
    description: joi.string().required(),
    location: joi.string().required(),
    country: joi.string().required(),

    image: joi.string().allow("", null),

    price: joi.number().required().min(0),

    category: joi.string()
      .valid(
        "Rooms",
        "Mountains",
        "City",
        "Castles",
        "Pools",
        "Camp",
        "Cabin",
        "Nature",
        "Farm",
        "Boat",
        "Cruise"
      )
      .required()
  }).required()
});



//Schema for review
const reviewSchema = joi.object({
    review : joi.object({
        comment : joi.string().required(),
        rating : joi.number().required().min(1).max(5),
    }).required()
});


// Make a single export statement at the end of the file
module.exports = {
  listingSchema,
  reviewSchema,
};
