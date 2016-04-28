var port = (process.env.VCAP_APP_PORT || 3000);
var host = (process.env.VCAP_APP_HOST || 'localhost');
var bodyParser = require("body-parser");
var express = require('express');
var request = require('request');
var Cloudant = require('cloudant');
var Config = require('config-js');
var json = require('json');
const fs = require('fs');
var config = new Config('./lifx_config.js');
var lifxKey = config.get('LIFX_KEY');
var me = config.get('CLOUDANT_USERNAME');
var password = config.get('CLOUDANT_PW');
var app = express();
var cloudant = Cloudant({account:me, password:password});
var db = cloudant.db.use('action_db');

/******

INIT

******/

app.use(bodyParser.json());
// app.use(express.json());
app.use(express.static(__dirname + '/public'));

console.log('LIFX Channel is up and running.');

/***************

DELETE END POINT

****************/

app.delete('/api/v1/lifx/delete/:recipeid', function(req, res){
	var del_ID = req.params.recipeid;
	
	db.get(del_ID, function(err, data){
		if(err){
			res.json({success: false, msg: 'Failed to find the recipe in the database, please try again.'});
		} else {
			var rev = data._rev;
			db.destroy(del_ID, rev,  function(err) {
				if (!err) {
					res.json({success: true, msg: 'Successfully deleted the lifx action from the database.'});
					console.log("Successfully deleted doc"+ del_ID);
				} else {
					res.json({success: false, msg: 'Failed to delete recipe from the database, please try again.'});
					//console.log("failed");
				}
			});
		}
	});
});

/**************************************

ADD NEW OR UPDATE A RECIPE IN DATABASE

**************************************/
		
//Endpoint for adding or changing emails in queue and database
app.post('/api/v1/lifx/new', function(req, res){
	//console.log(req.body);
	var ID = req.body.recipeid;
	var light = req.body.action.lightID;
	var type = req.body.type;
	//var fade = req.body.action.fadeDur;
	var color = req.body.action.Color;
	var scene = req.body.action.scene;
	var bright = req.body.action.Brightness;
	var breath = req.body.action.numBreath;
	var blink = req.body.action.numBlink;
	//will use fade in this
	var transDur = req.body.action.transDur;
	var advSet = req.body.action.advSettings;
	
	//Makes sure data in JSON is formatted and submitted correctly.
	if(type != "turnOn" && type != "turnOff" && type != "toggle" && type != "scene" && type != "color" && type != "blink" && type != "breathe") {
		res.json({success: false, msg: 'The incorrect recipe type was submitted.'});
	} else if (ID == "") {
		res.json({success: false, msg: 'No recipeID was submitted.'});
	} else {
		var actionJSON = {'lightID':light , 'transDur':transDur , 'color':color , 'scene':scene, 'brightness':bright, 'numBreathe':breath, 'numBlink':blink, 'advOption':advSet };
		var recipeJSON = { 'relation':'LIFX', 'actionType':type, 'action': actionJSON};
		
		db.insert(recipeJSON, function(err, body, header){
			if(err){
				res.json({success: true, msg: 'Failed to store lifx recipe in database...please try again.'});
			} else {
				res.json({success: true, msg: 'LIFX action was submitted.'});
			}
		});		
	}
});

/***********************************

ENDPOINT FOR ACTION BEING TRIGGERED

***********************************/
		
//Endpoint for doing an action
app.post('/api/v1/lifx/:recipeid', function(req, res){
	var ID = req.params.recipeid;
	
	//Makes sure data in JSON is formatted and submitted correctly.
	if (ID == "") {
		res.json({success: false, msg: 'No recipeID was submitted.'});
	} else {
		db.get(ID, function(err, data){
		if(err){
			res.json({success: false, msg: 'Failed to find the recipe in the database, please try again.'});
		} else {
			if (data.relation == "LIFX") {
				doAction(data);
				res.json({success: true, msg: 'Sucessfully did the LIFx action.'});
			} else {
				res.json({success: false, msg: 'The recipeID enetered was not for a LIFx action, please try again.'});
			}
		}		
	}
});

/**************

  FUNCTIONS

**************/

//does the LIFx action in the inputed recipe
function doAction(recipe) {
	var eMsg;
	var xhttp = new XMLHttpRequest();
	var url = "https://api.lifx.com/v1/";
	var header = "Authorization: Bearer "+lifxKey;
	//get all potential required info
	var type = recipe.actionType;
	var light = recipe.action.lightID;
	var trans = recipe.action.transDur;
	var color = recipe.action.color;
	var scene = recipe.action.scene;
	var bright = recipe.action.brightness;
	var breath = recipe.action.numBreathe;
	var blink = recipe.action.numBlink;
	var advSet = recipe.action.advOption;
	//find which type of lifx action to do
	if (type == "turnOn") {
		xhttp.open("POST", url, true);
		//put credentials
		xhttp.setRequestHeader("", "");
		//put post info
		xhttp.send("");
	} else if (type == "turnOff") {
		
	} else if (type == "toggle") {
		
	} else if (type == "scene") {
		
	} else if (type == "color") {
		
	} else if (type == "breath") {
		
	} else if (type == "blink") {
		
	} else {
		console.log("Not going into any type.");
	}
}





app.listen(port);