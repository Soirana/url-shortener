var express = require('express');
var fs = require('fs');
var validUrl = require('valid-url');
var Datastore = require('nedb');

var app = express();
var html = fs.readFileSync('index.html');
var deployUrl = "https://soir-short.herokuapp.com/"
var db = new Datastore({ filename: 'links.db', autoload: true });
var overLimit = false;
app.set('port', (process.env.PORT || 5000));

app.get('/', function(request, response) {
	response.writeHead(200, {'Content-Type': 'text/html'});
	response.end(html);
	});

db.count({}, function (err, count) { //count is a number
  	if (count === 0){
		var doc = {count: true, number: 1};
  		db.insert(doc);
  	} else{
  		db.update({count: true}, { $set: { number: count }});
  		if (count>9999) {overLimit = true}
  	}

	app.get('/*', function(request,response) {
		var stringa = request.params[0];

		if (/^[0-9]+$/.test(stringa)){
			stringa = deployUrl + stringa;
			db.find({short: stringa}, function (err, docs) {
				if (docs.length === 0) {
					response.json({	error: "Does not seem to in a database."});
				}
				else{
					response.redirect(docs[0].target);
				}
			});
		} else{
			if (validUrl.isUri(stringa)){
				count = count+1;
				if (count>9999) {
				overLimit = true;
				count = count % 10000;
			}			
				function findMatch(index, str){
				db.find({target: str}, function (err, docs) {
					if (docs.length !== 0) {
						response.json({	original: str, short: docs[0].short});		
					} else{
						var tempStri =deployUrl+index;
						if (overLimit) {
							db.update({short: tempStri}, { $set: { target: str}});
						} else{
							db.insert({target: str, short: tempStri});
					}
						response.json({	original: str, short: tempStri});
					}
				});
				};
				findMatch(count-1, stringa);
    		} else {
        		response.json({	error: "Does not seem to be a proper url."});
    	}
		}
});
});

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

