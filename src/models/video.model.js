import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema({
    owner : {
        type : Schema.Types.ObjectId,
        ref : "User"
    },
    videoFile : {
        url: { type: String, required: true },
        publicId: { type: String, required: true }
    },
    thumbnail : {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
    },
    title : {
        type: String,
        required : true
    },
    description : {
        type : String,
        required : true
    },
    duration : {
        type : Number, //from cloudnary url
        required : true
    },
    views :{
        type : Number,
        default : 0
    },
    isPublished :{
        type : Boolean,
        required : true
    }
} , {timestamps: true})

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model("Video" , videoSchema)