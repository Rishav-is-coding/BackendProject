//require('dotenv').config({path: './env'})
import { app } from './app.js';
import dotenv from 'dotenv'
import connetDB from './db/index.js'
dotenv.config({
    path : './.env'
})


connetDB()
    .then(() => {
        app.on("error" , (error) => {
            console.log("ERROR COMING : ", error)
        })

        app.listen(process.env.PORT || 8000, () => {
            console.log("Server is running at PORT : ", process.env.PORT || 8000)
        })
    })
    .catch((error) => {
        console.log("MONGODB CONNECTION FAILED : " , error)
    })




























// HANDELLING CONNECTION IN SAME INDEX.JS 

// import express from 'express'

// ;(async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on("error" , (error) => {
//             console.log("ERROR : ", error)
//             throw error
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is listening on PORT : ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error("ERROR : " , error)
//         throw error
//     }
// })()