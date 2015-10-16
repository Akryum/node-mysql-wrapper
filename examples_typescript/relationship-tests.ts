import * as express from 'express';
import * as http from 'http';
import * as mysqlWrapper from "node-mysql-wrapper";
var app = express();
var server = http.createServer(app);


var db = mysqlWrapper.wrap("mysql://kataras:pass@127.0.0.1/taglub?debug=false&charset=utf8");
console.log('MYSQL IS UP AND RUNNING');

class User { //or interface
    userId: number;
    username: string;
    mail: string;
    password: string;
    myStories: Story[];

}

class Story {
    storyId: number;
    content: string;
    title: string;
    authorId: number;
    author: User;
}

var waitForMsg = ("---------------- WAIT 2 SECONDS FOR NEXT TEST-----------------------");
var finishTestsMsg = ("----------------- ALL TESTS HAVE BEEN FINISHED-----------------");

db.ready(() => {
    test1();
    setTimeout(test2, 2000);


});


function test1() {
    console.log("#1-------------- FIND A USER AND HIS/HER STORIES ------------");
    var usersTable = db.table<User>("users");
    var criteria = usersTable.criteria.where("userId").eq(16).joinAs("myStories", "stories", "authorId", "userId").build();
    usersTable.findSingle(criteria).then(_result=> {
        console.log(_result.username + " 's stories:");
        _result.myStories.forEach(story=> {
            console.log("Author ID: " + story.authorId + " Title: " + story.title + "\n");
        });
        console.log(waitForMsg);
    });

}

function test2() {
    console.log("#2---------------FIND STORIES AND THEIR AUTHOR -----------------");
    var storiesTable = db.table<Story>("stories");
    var storyCriteria = storiesTable.criteria.joinAs("author", "users", "userId", "authorId").at("author").limit(1).build(); //limit 1 so the 'author' property will be an object and not an array.
    storiesTable.find(storyCriteria).then(_results=> {
        _results.forEach(_result=> {
            console.log('Story #' + _result.storyId + ' Title: ' + _result.title + ' Author: #' + _result.author.userId + ' ' + _result.author.username + '\n');
        });
        console.log(finishTestsMsg);
    });


}

server.on('uncaughtException', function(err) {
    console.log(err);
});

process.on("SIGHUP", () => {
    db.end((err) => {
        if (err) {
            console.dir(err);
            setTimeout(() => {
                process.exit();
            }, 8000);
        } else {
            process.exit();
        }

    });
});

var httpPort = 1193;//config.get('Server.port') || 1193;
server.listen(httpPort, function() {
    console.log("Server is running on " + httpPort);
});
