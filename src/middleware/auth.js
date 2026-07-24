const adminAuth =  (req, res, next) => {
    console.log("Checking for admin auth");

    const token = "xyz";
    const isAdminAuth = token === "xyz";

    if (!isAdminAuth) {
        return res.status(401).send("Unauthorized request");
    }

    next();
}
const userAuth = (req, res, next) => {
    console.log("Checking for user auth");

    const token = "xyz";
    const isUserAuth = token === "xyz";

    if (!isUserAuth) {
        return res.status(401).send("Unauthorized request");
    }

    next();
}


module.exports={
    adminAuth,
    userAuth
}