import multer from "multer";

//storing on disk -> as memory can be full
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null , "./public/temp")
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

export const upload = multer({
    storage : storage,
})