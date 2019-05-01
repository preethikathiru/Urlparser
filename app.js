var express = require("express");
const request = require('request');
var cheerio = require("cheerio");
var bodyParser = require('body-parser');
var mongoose = require("mongoose");
var app = express();
var port = 8000;

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
    url: {
        type: String,
        index: true,
        unique: true
    },
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
        var linkHrefs = $('link').map(function (i) {
            var link = $(this).attr('href');
            return link;
        }).get();
        let uniqueEmails = [...new Set(emails)];
        var websiteJson = { url: websiteurl, emails: uniqueEmails, links: linkHrefs }
        WebsiteModel.findOne({ url: websiteurl }).then(function (website) {
            var websiteModelObject = new WebsiteModel(websiteJson);
            if(website) {
                website.emails = uniqueEmails;
                website.links = linkHrefs;
                websiteModelObject = website;
            }
            websiteModelObject.save()
                .then(function (website) {
                    console.log(website)
                    res.send({
                        message: "Website details stored successfully",
                        website: website
                    });
                })
                .catch(err => {
                    console.log(err)
                    res.status(400).send("Error saving to database");
                })
        }).catch(err => {
            console.log(err)
            res.status(400).send("Error finding the website url");
        })

    })
});

app.listen(process.env.PORT || port, () => {
    console.log("Server listening on port " + port);
});