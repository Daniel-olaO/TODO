const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    userName:{
       type: String,
        unique: true
    },
    password: String,
    loginHistory: [{
        dateTime: Date,
        userAgent: String
    }]
});

var User;

module.exports = {
    initialize: ()=>{
        return new Promise((resolve, reject)=>{
            let db = mongoose.createConnection(process.env.USERDBSTRING)
            db.on('error', (err)=>{
                    reject(err); // reject the promise with the provided error
            });
            db.once('open', ()=>{
                User = db.model("users", userSchema);
                resolve();
            });

        });
    },
    registerUser: (userData)=>{
        return new Promise((resolve, reject)=>{
            //console.log(userData)
            if(userData.password === userData.password2){
                userData.userId = 'id' + (new Date()).getTime();
                let newUser = new User(userData);
                bcrypt.hash(newUser.password, 10)
                .then(hash=>{
                    newUser.password = hash;
                    newUser.save()
                    .then(()=>resolve(`user ${newUser.userName} saved`))
                    .catch((err)=>{
                        if(err.code === 11000)
                            reject("User Name already taken");
                        else if(err)
                            reject(`There was an error creating the user: ${err}`);
                    })
                })
                .catch(err=>{
                    reject(err);
                });

            }
            else{
                reject("Password do not match");
            }
        });
    },
    checkUser:(userData)=>{
        return new Promise((resolve, reject)=>{
            User.find({userName: userData.userName})
            .exec()
            .then((user)=>{
                if(user.length < 1){
                    reject(`Unable to find user`);
                }
                else{
                    bcrypt.compare(userData.password, user[0].password).then((result) => {
                       if(result){
                            user[0].loginHistory.push({
                                dateTime: (new Date()).toString(),
                                userAgent: userData.userAgent
                            });
                            User.updateOne({
                                userName:  user[0].userName
                            },{
                                $set: {loginHistory: user[0].loginHistory}
                            }).exec()
                            .then(()=> resolve(user[0]))
                            .catch((err)=>{
                                reject(`There was an error verifying the user: ${err}`);
                            });
                        }
                        else{
                            reject(`Incorrect Password for user: ${userData.userName}`);
                        }
                    });                     
                }
            }).catch((err)=>{
                reject(`Unable to find user`);
            });

        });
    }
}