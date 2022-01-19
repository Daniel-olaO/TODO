const express = require('express');
const app = express();
const exphbs = require('express-handlebars');
const  bodyParser = require('body-parser');
const clientSessions = require("client-sessions");
const dotenv = require('dotenv').config();
const HTTP_PORT = process.env.PORT || 8080;
const userService = require('./model/userDB');
const taskService = require('./model/taskBD');

var USERNAME, TASKNAME;

app.engine('.hbs', exphbs.engine({ extname: '.hbs',
            defaultLayout: 'main'
}));
//session middleware
app.use(clientSessions({
    cookieName: "session",
    secret: "secret",
    duration: 2 * 60 * 1000, 
    activeDuration: 1000 * 60,
  }));
  var ensureLogin = (req, res, next)=>{
    if(!req.session.user){
        res.redirect("/");
    }
    else{
        next();
    }
}

app.use((req, res, next)=>{
    res.locals.session  = req.session;
    next();
});
app.set('view engine', '.hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get('/', (req, res)=>{
    res.render('login',{
        defaultLayout: true,
    });
});

app.get('/signUp', (req, res)=>{
    res.render('signUp',{
        defaultLayout: true
    });
});
//user routes
app.post('/signUp', (req, res)=>{
   userService.registerUser(req.body)
    .then((msg)=>{
       res.redirect('/');
    })
    .catch(err=>{
        console.log(err);
        res.redirect('/signUp')
    });
})
app.post('/login', (req, res)=>{
    req.body.userAgent = req.get('User-Agent');
    userService.checkUser(req.body)
    .then((user)=>{
        req.session.user = {
            userName: user.userName
        }
        res.redirect(`/task/${user.userName}`)
    })
    .catch(err=>{
        console.log(err);
        res.render('login',{
            errorMessage: err
        })
    });
})



//task route
app.get('/task/:userName', ensureLogin, (req,res)=>{
    USERNAME = req.params.userName;
    taskService.getTasksByUser(USERNAME).then(data=>{
        if(data){
            res.render('tasks',{
                defaultLayout: true,
                data: data,
                userName: USERNAME
            });
        }
        else{
            console.log('ek');
            res.render('tasks',{
                defaultLayout: true
            });
        }
    })
    .catch((err)=>{
        res.render('tasks',{
            defaultLayout: true
        });
    })
});
app.post('/addTask', ensureLogin, (req, res)=>{
    taskService.createTask(req.body, USERNAME).then((data)=>{
        res.redirect(`/task/${USERNAME}`);
    })
    .catch((err)=>{
        res.status(401).json({
            "error":err
        });
    });
});
app.get('/deleteTask/:task', ensureLogin, (req,res)=>{
    taskService.deleteTask(req.params.task).then(()=>{
        res.redirect(`/task/${USERNAME}`);
    })
    .catch((err)=>{
        res.status(401).json({
            "error": err
        })
    })
});
app.get("/logout", (req, res)=>{
     req.session.reset();
     res.redirect("/");
 });
// setup http server to listen on HTTP_PORT
taskService.initialize()
.then(userService.initialize)
.then(function(){
    app.listen(HTTP_PORT, function(){
        console.log("app listening on: " + HTTP_PORT)
    });
}).catch(function(err){
    console.log("unable to start server: " + err);
});