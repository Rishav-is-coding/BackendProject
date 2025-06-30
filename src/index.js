//require('dotenv').config({path: './env'})

import dotenv from 'dotenv'
import connetDB from './db/index.js'
dotenv.config({
    path : './env'
})


connetDB()




























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