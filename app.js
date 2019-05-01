var express = require("express");
const request = require('request');
var cheerio = require("cheerio");
var bodyParser = require('body-parser');
var mongoose = require("mongoose");
var app = express();
var port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://node_demo:node_demo123@ds151222.mlab.com:51222/myfirstdb")
    .then((data) => {
        console.log('db connected')
    }).catch((err) => {
        console.log(err)
    })

var extractEmails = function (text) {
    var extractedEmails = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
    return extractedEmails;
}
var websiteSchema = new mongoose.Schema({
    url: String,
    links: [String],
    emails: [String],
})

var WebsiteModel = mongoose.model("website", websiteSchema);

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});

app.post("/parseurl", (req, res) => {
    var websiteurl = req.body.WEBSITE;
    request(websiteurl, function (error, response, body) {
        var emails = extractEmails(body);
        var $ = cheerio.load(body);
        var linkHrefs = $('link').map(function(i) {
            var link =  $(this).attr('href');
            return  link;
        }).get();
        let uniqueEmails = [...new Set(emails)];
        var websiteJson = { url: websiteurl, emails: uniqueEmails, links : linkHrefs }
        var parseddetails = new WebsiteModel(websiteJson);
        parseddetails.save()
            .then(function (website) {
                console.log(website)
                res.send({
                    message: "website details stored successfully",
                    website: website
                });
            })
            .catch(err => {
                console.log(err)
                res.status(400).send("unable to save in database");
            })
    })
});

app.listen(port, () => {
    console.log("Server listening on port " + port);
});