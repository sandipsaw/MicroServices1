const jwt = require('jsonwebtoken');

const createAuthMiddleware = (roles = ['user']) =>{
    return authMiddleware = (req,res,next) =>{
        const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];

        if(!token){
            return res.status(401).json({
                message:"Unauthorized : no token provided"
            })
        }
        try{
            const decoded = jwt.verify(token,process.env.JWT_SECRET);
            if(!roles.includes(decoded.role)){
                return res.status(403).json({
                    message:"forbidden insufficient permission"
                })
            }
            req.user = decoded;
            console.log(decoded);
            
            next();
        }
        catch(error){
            console.log(error);
            return res.status(401).json({
                message:"Unauthorized : Invalid token"
            })
            
        }
    }
}

module.exports = {createAuthMiddleware};