var express = require("express");
var app = express();
var port = 3000;
var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const request = require('request');
var cheerio = require("cheerio");

var mongoose = require("mongoose");
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://node_demo:node_demo123@ds151222.mlab.com:51222/myfirstdb")
    .then((data) => {
        console.log('db connected')
    }).catch((err) => {
        console.log(err)
    })

var extractEmails = function (text) {
    return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
}

var websiteSchema = new mongoose.Schema({
    url : String,
    links : [String],
    emails : [String],
})

var websitedetails = mongoose.model("website", websiteSchema);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/parseurlold", (req, res) => {
    var websiteurl = req.body.WEBSITE;
    request(websiteurl, function (error, response, body) {
        var emails = extractEmails(body)
        console.log('Email variable', emails)
        let uniqueEmails = [...new Set(emails)];
        var websiteJson = {url : websiteurl , emails : uniqueEmails }
        console.log(uniqueEmails, 'unique array')
        var parseddetails = new websitedetails(websiteJson);
        parseddetails.save()
            .then(item => {
                console.log(item)
            })
            .catch(err => {
                console.log(err)
                res.status(400).send("unable to save in database");
            })
        res.send('The emails are stored succcessfully');
    })
});

app.listen(port, () => {
    console.log("Server listening on port " + port);
});