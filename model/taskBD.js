const Sequelize = require('sequelize');

// set up sequelize to point to our postgres database
var sequelize = new Sequelize(process.env.PGDATABASE, process.env.PGUSER, process.env.PGPSWD, {
    host: process.env.PGHOST,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: false }
});
var Task = sequelize.define('Task',{
    userName: Sequelize.STRING,
    taskName: Sequelize.STRING,
    initTime: Sequelize.TIME,
    endTime: Sequelize.TIME
});

module.exports = {
    initialize: ()=>{
        return new Promise((resolve, reject)=>{
            sequelize.authenticate().then(()=>{
              console.log("postgress connection was successful");
              resolve();
            }).catch(()=>{
                console.log("unable to sync the database");
                reject()
            });
        });
    },
    createTask: (task, name)=>{
        return new Promise((resolve, reject)=>{
        sequelize.authenticate().then(()=>{
            Task.create({
                userName: name,
                taskName: task.TaskName,
                initTime: task.InitTime,
                endTime: task.EndTime
            }).then(()=>{
                resolve(`${task.TaskName} added`);
            }).catch(()=>{
                reject("unable to create task");
            });
        }); 
        });
    },
    getTasksByUser: (name)=>{
        return new Promise((resolve, reject)=>{
            sequelize.authenticate().then(()=>{
                Task.findAll({
                    where:{
                        userName:name
                    }
                }).then((data)=>{
                    resolve(data.map((value)=>value.dataValues));
                }).catch((err)=>{
                    reject('no results returned');
                });
            });
        });
    },
    deleteTask: (task)=>{
      return new Promise((resolve,  reject)=>{
            sequelize.authenticate().then(()=>{
                Task.destroy({
                    where: {taskName: task}
                }).then(()=>{
                    resolve("task deleted")
                }).catch((err)=>{
                    reject(err);
                });
            });
        });  
    }
}