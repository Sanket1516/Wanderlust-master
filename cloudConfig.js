//all in documentation of multer-storage-cloudinary in npm

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

//here we will configure cloudinary with the credentials present in the .env file
cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'Wanderlust', // The name of the folder in cloudinary where the images will be stored
    allowed_formats: ['jpeg', 'png', 'jpg'], // Specify the allowed formats for the images
    // public_id is the name of the image in the cloudinary folder
  },
});

module.exports = {
    cloudinary,
    storage
}

//we will use them in listing .js