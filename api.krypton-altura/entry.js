const express = require('express');
const Joi = require('joi'); //used for validation
const app = express();
const fs = require('fs');
const userFile = require('./user.json');
const dataFile = require('./dat.json');
const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger_output.json')

const jwt = require('jsonwebtoken');

app.use(express.json());

//READ Request Handlers
app.get('/', (req, res) => {
    res.send('{"msg": "Welcome to API.", "code": 200}');;
});
app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))
app.patch('/api/v6/capes/:capeId/update', (req, res) => {
    res.setHeader('Content-Type', 'json/application')
    jwt.verify(req.body.token,'secretkey',(err,authData)=>{
        if(err)
            res.sendStatus(403);
        else {
    // update the cape from the data file 
    const cape = dataFile.capes.find(c => c.id === req.params.capeId);
    if (!cape) return res.status(404).send('{"msg": "Cape not found", "code": 404}');
    cape.name = req.body.name;
    cape.description = req.body.description;
    cape.price = req.body.price;
    cape.image = req.body.image;

    // save the cape to the data file
    saveCapes();
    res.send('{"msg": "Cape updated", "code": 200}');
    }
    })
});


app.get('/api/v6/capes', (req, res) => {
    res.setHeader('Content-Type', 'json/application')
    res.send(dataFile);
});

app.post('/api/v6/capes', (req, res) => {
    jwt.verify(req.body.token,'secretkey',(err,authData)=>{
        if(err)
            res.sendStatus(403);
        else {
            res.setHeader('Content-Type', 'json/application')
            // add a new cape
            const cape = {
                id: dataFile.capes.length + 1,
                name: req.body.name,
                description: req.body.description,
                image: req.body.image,
                price: req.body.price,
            }
            dataFile.capes.push(cape);
            saveCapes();
            res.send(dataFile);
        }
    })
});

app.get('/api/v6/users/give', (req, res) => {
    jwt.verify(req.body.token,'secretkey',(err,authData)=>{
        if(err)
            res.sendStatus(403);
        else {
            res.setHeader('Content-Type', 'json/application')
            //add the cape id to the userFile.users.capes array
            userFile.users.forEach(user => {
                if(user.name == req.body.username) {
                    user.capes.push(req.body.capeId);
                    validateAndSave(userFile);
                    res.send('{"msg": "Cape added to user", "code": 200}');
                } 
            });
        }
    })
});


app.get('/api/v6/users', (req, res) => {
    res.setHeader('Content-Type', 'json/application')
    res.send(userFile);
});

app.patch('/api/v6/users/:userName/update', (req, res) => {
    jwt.verify(req.body.token,'secretkey',(err,authData)=>{
        if(err)
            res.sendStatus(403);
        else {
            res.setHeader('Content-Type', 'json/application')
            const userName = req.params.userName;
            const user = userFile.users.find(u => u.name === userName);
            if (!user) return res.status(404).send('User not found');

            user.name = req.body.username;
            user.email = req.body.email;
            user.password = req.body.password;

            validateAndSave(userFile);

            res.send(user);
        }
    })
});

app.get('/api/v6/users/login/:userName', (req, res) => {   
    res.setHeader('Content-Type', 'json/application')
    const userName = req.params.userName;
    const user = userFile.users.find(u => u.name === userName);
    if (!user) return res.status(404).send('User not found');
    // check if password matches the request body's password
    if (user.password !== req.body.password) return res.status(401).send('{"msg": "InvalidPSS"}');
    // if password matches, return the user

    jwt.sign({user},'secretkey',(err,token)=>{
        res.json({
            token
        })
    })
});

app.post('/api/v6/users', (req, res) => {

    const schema = Joi.object().keys({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        capes: Joi.array().required(),
        userID: userFile.capes.length + 1
    });
    
    req.body.userID = dataFile.capes.length + 1;

    userFile.users.push(req.body);

    validateAndSave(userFile);

    res.send(userFile);
});



function saveCapes() {
    fs.writeFile('./dat.json', JSON.stringify(dataFile), function writeJSON(err) {
        if (err) return console.log(err);
        console.log(JSON.stringify(dataFile));
        console.log('writing to ' + './dat.json');
    });
}

function validateAndSave(user) {
    fs.writeFile('./user.json', JSON.stringify(userFile), function writeJSON(err) {
        if (err) return console.log(err);
        console.log(JSON.stringify(userFile));
        console.log('writing to ' + './user.json');
    });
}
function verifyToken(req,res,next){
    //Auth header value = > send token into header

    const bearerHeader = req.headers['authorization'];
    //check if bearer is undefined
    if(typeof bearerHeader !== 'undefined'){

        //split the space at the bearer
        const bearer = bearerHeader.split(' ');
        //Get token from string
        const bearerToken = bearer[1];

        //set the token
        req.token = bearerToken;

        //next middleweare
        next();

    }else{
        //Fobidden
        res.sendStatus(403);
    }

}

//PORT ENVIRONMENT VARIABLE
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Listening on port ${port}..`));