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
        const response = await cloudinary.uploader.upload(localfilepath , {
            resource_type : "auto"
        })
        console.log("file has been uploaded on cloudinary : ", response.url);
        fs.unlinkSync(localfilepath);
        return response;
    }catch(err) {
        if(localfilepath){
            fs.unlinkSync(localfilepath) //remove the locally saved temporary file, as uploading got failed
        }
        console.log('upload to cloudinary failed : ' , err)
        return null;
    }
}

const deleteFromCloudinary = async (publicID) => {
    try {
        if(!publicID) return "could not find the public Id"
        const res = await cloudinary.uploader.destroy(publicID)
        return res
    } catch(error) {
        console.error("Error while deleting from cloudinary : " , error)
    }
}

export {uploadOnCloudinary , deleteFromCloudinary}