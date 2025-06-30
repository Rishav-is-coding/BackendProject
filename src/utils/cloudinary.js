import { v2 as cloudinary } from 'cloudinary';
import { response } from 'express';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localfilepath) => {
    try {
        if(!localfilepath) return null
        cloudinary.uploader.upload(localfilepath , {
            resource_type : "auto"
        })
        console.log("file has been uploaded on cloutnary : ", response.url);
        return response;
    }catch(err) {
        fs.unlinkSync(localfilepath) //remove the locally saved temporary file, as uploading got failed
        console.log('upload to cloudinary failed : ' , err)
        return null;
    }
}

export {uploadOnCloudinary}