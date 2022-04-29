const LocalStrategy = require('passport-local').Strategy;
const bcrypt= require('bcrypt')

function initialize(passport, getUserByEmail, getUserByID){
    const authenticateUser= async (username, password, done) => {
        const user= await getUserByEmail(username)
        console.log("USER: "+user)
        if(user==null){
            return done(null, false, {message: 'No user with that email'})
        }
        try{
            if(await bcrypt.compare(password, user.password)){
                console.log("Password Matched")
                return done(null, user)
            }else{
                return done(null, false, {message: 'Password Incorrect'})
            }
        } catch(e){
            done(e)
        }
    }

    passport.use(new LocalStrategy({usernameField: 'username'}, 
    authenticateUser))
    passport.serializeUser((user, done)=> done(null, user._id))
    passport.deserializeUser(async (_id, done)=>{
        return done(null, await getUserByID(_id))
    })
}

module.exports = initialize