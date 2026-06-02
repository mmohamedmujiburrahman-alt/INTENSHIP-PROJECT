import { verifyToken } from "@clerk/backend"

export const protect = async (req, res, next) => {

   try {

      const authHeader = req.headers.authorization

      if (!authHeader) {
         return res.status(401).json({
            success: false,
            message: "No token"
         })
      }

      const token = authHeader.split(' ')[1]

      const payload = await verifyToken(token, {
         secretKey: process.env.CLERK_SECRET_KEY
      })

      console.log(payload)

      req.userId = payload.sub

      next()

   } catch (error) {

      console.log(error)

      return res.status(401).json({
         success: false,
         message: "Invalid token"
      })
   }
}