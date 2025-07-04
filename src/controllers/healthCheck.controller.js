import {ApiResponse} from '../utils/ApiResponse.js'
import {asyncHandler} from '../utils/asyncHandler.js'

const healthCheck = asyncHandler(async (req, res) => {
    return res.status(200).json(200, null, "health Check OK")
})

export {healthCheck}