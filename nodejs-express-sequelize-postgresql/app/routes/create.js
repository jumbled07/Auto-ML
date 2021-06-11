var express = require('express');
var router = express.Router();
var pool = require('../db/dev/pool');
var Helper = require('../db/helper')
var bodyParser = require('body-parser');
var fs = require('fs'); 
const jwt = require('jsonwebtoken');
var path= require('path');
var {
	v4 : uuidv4,
	parse:uuidParse,
	stringify : uuidStringify} = require('uuid');
var multer = require('multer');
var cors = require('cors');
const { execFile } = require('child_process');
var session = require('express-session')
var http    = require('http'),
    io      = require('socket.io'),
    fs      = require('fs');
    util = require('util');
var ps = require('ps-node');
var spawn = require('child_process').spawn;
router.use(cors());
router.use(express.json());
router.use(express.urlencoded({
	extended: true
}));
router.use(session({secret: 'Your_Secret_Key',
	secure: true,
	ephemeral: true,
	resave: true,
  
    // Forces a session that is "uninitialized"
    // to be saved to the store
    saveUninitialized: false
}));
// var filename = 0 , child , logfilename = "" , studyfile = ""; 
// var datafile_id1=[];
// var network_id1;


var storage = multer.diskStorage({ 
    destination: function (req, file, cb) {
    	var dir="";
    	if (file.fieldname === "test_data")
    		dir = `./uploads/${req.params.projectID}/${req.params.evaluationID}`;
    	else {
    		dir = `./uploads/${req.params.projectID}`;
    	}
		fs.exists(dir, exists => {
    		if(!exists) {
    			return fs.mkdir(dir, error =>
    				cb(error,dir));
    		}
    		return cb(null,dir);
		})
    }, 
    filename: function (req, file, cb) { 
      cb(null, file.originalname); 
    } 
}); 
const maxSize = 1 * 1000 * 1000; //1mb 
    
var upload = multer({  
    storage: storage, 
    limits: { fileSize: maxSize }, 
    fileFilter: function (req, file, cb){ 
    	if (!file.originalname.match(/\.(txt|py|png|jpg|csv)$/)) {
        	return cb(new Error('Wrong file format!'));
    	}
    	else return cb(null, true);
 
    }  
});

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log(authHeader);
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        console.log(token);

        jwt.verify(token, req.params.projectID , (err, user) => {
            if (err) {
            	console.log(err.message);
                return res.sendStatus(403);
            }

            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

var processDict = {};

router.get('/home', async(req,res) =>{
	res.sendfile("home.html");
});

router.post('/home/signup', async(req,res) => {   // /home post
	try{
		if (!req.body.name || !req.body.password) {
       res.status(400).send({'message': 'Some values are missing'});
    	}
    	const hashPassword = Helper.hashPassword(req.body.password);
		var projectID = uuidv4();
		var parsedId = uuidParse(projectID);
		var projectID = uuidStringify(parsedId);
		var datetime=  new Date();
		var timing = datetime.toISOString().slice(0,10);
		var options = { hour12: false };
		timing += ' ';
		timing += datetime.toLocaleTimeString('en-US',options);
		var name= req.body.name;
		var newproject1 = await pool.query(
			"INSERT INTO project (projectId) VALUES('"+projectID+"')");
		var newuser = await pool.query(
			"INSERT INTO users(userName, password, createdDate, projectId) VALUES ('"+name+"', '"+hashPassword+"', '"+timing+"', '"+projectID+"')")
		const token = Helper.generateToken(projectID,projectID);
		res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({token: token,projectID:projectID}));
		res.status(201).end();
		// let link = `/dashboard/${projectID}`;                   //redirect
		// res.redirect(`${link}`);

	}
	catch(err){
		if (err.routine === '_bt_check_unique') {
			console.error(err.message);
        	res.status(400).send({ 'message': 'User with that name already exist' })
      }
      	else{
		console.error(err.message);
		res.send("error in create");
		}
	}
});

router.post('/home/signin', async(req,res)=> {
	if (!req.body.name || !req.body.password) {
       res.status(400).send({'message': 'Some values are missing'});
    }
    const text = 'SELECT * FROM users WHERE userName = $1';
    try {
      const { rows } = await pool.query(text, [req.body.name]);
      if (!rows[0]) {
         res.status(400).send({'message': 'The credentials you provided is incorrect'});
      }
      if(!Helper.comparePassword(rows[0].password, req.body.password)) {
         res.status(400).send({'message': 'The credentials you provided is incorrect'});
      }
      const token = Helper.generateToken(rows[0].projectid, rows[0].projectid);
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify({token: token, projectID: rows[0].projectId}));
      res.status(201).end();
      // let link = `/dashboard/${projectID}`;                  //redirect
      // res.redirect(`${link}`);

    } catch(error) {
       res.status(400).send(error)
    }
});

router.get('/dashboard/:projectID', authenticateJWT , async(req,res) => {
	res.render("dashboard.html");
});

router.get('/dashboard/:projectID/history', authenticateJWT, async(req,res) => {
	try{
	var projectID = req.params.projectID;
	var stat = "killed";
	var success_models = await pool.query("SELECT * FROM Predictions where projectId = '"+projectID+"' ");
	var unsucessful_models = await pool.query("SELECT * FROM Logs where (projectId = '"+projectID+"' and status = '"+stat+"')");
	res.setHeader('Content-Type', 'application/json');
	res.write(JSON.stringify({success_model: success_models.rows, unsucessful_models: unsucessful_models.rows}));
	res.end(); 
	}
	catch(err){
		console.error(err.message);
	}
})

router.get('/dashboard/:projectID/datasets', authenticateJWT, async(req,res) => {
	try{
		var projectID = req.params.projectID;
		var alldatasets = await pool.query("SELECT datasetId,name FROM Datasets where projectId='"+projectID+"'");
		console.log(req.session.filename);
		res.json(alldatasets.rows);
	}
	catch(err){
		console.error(err.message);
	}
}); 

router.delete('/dashboard/:projectID/datasets/:datasetId', authenticateJWT, async(req,res) =>{
	try{
		var projectID = req.params.projectID;
		var datasetID= req.params.datasetId;
		var deletedatasets = await pool.query("DELETE FROM datasets where datasetId='"+datasetID+"'");
		var deleteproject = await pool.query("UPDATE project SET datasetId= array_remove(datasetId, '"+datasetID+"') WHERE projectId = '"+projectID+"'");
		res.json("deleted");
	}
	catch(err){
		console.error(err.message);
	}
});

router.post('/dashboard/:projectID/datasets', upload.fields(
	[
        {
            name: 'test_data' ,
            maxCount : 10
        } ,
        {
        	name : 'userfile' ,
        	maxCount : 10
        }
    ]), authenticateJWT, async(req,res) => {
	try{
		var newdatasetID = uuidv4();
		var parsedId = uuidParse(newdatasetID);
		var newdatasetID = uuidStringify(parsedId);
		var dname= req.body.dname;  
		var projectID = req.params.projectID;
		const dataset = req.files['userfile'];
		var originalnames = dataset.map(file => file.originalname);
		var filepaths = dataset.map(file => file.path);
		var filesizes = dataset.map(file => file.size);
		var filetypes = dataset.map(file => file.mimetype);
		var datetime=  new Date();
		var timing = datetime.toISOString().slice(0,10);
		var options = { hour12: false };
		timing += ' ';
		timing += datetime.toLocaleTimeString('en-US',options);
		var i;
		var tablefile=[];
		
		for(i=0;i<req.files['userfile'].length;i++)   
		{
			var dfile_id = uuidv4();
			var parsedId= uuidParse(dfile_id);
			var dfile_id= uuidStringify(parsedId);
			var originalname = originalnames[i];
			var filepath = filepaths[i];
			var filesize = filesizes[i]; var filetype= filetypes[i];
			var newfile= await pool.query("INSERT INTO File (fileId,fileName,path,fileSize,fileType,createdOn) VALUES ('"+dfile_id+"','"+originalname+"','"+filepath+"','"+filesize+"','"+filetype+"','"+timing+"')");
            tablefile.push(`${dfile_id}`);
		}
		console.log("outside loop");
		var newdata = await pool.query(
			"INSERT INTO Datasets (datasetId, projectId,name) VALUES ('"+newdatasetID+"', '"+projectID+"', '"+dname+"')");
		var nedata = await pool.query("UPDATE datasets SET fileId=array_append(fileId,'"+tablefile+"') WHERE datasetId='"+newdatasetID+"'");
		var projectupdate = await pool.query("UPDATE PROJECT SET datasetId = array_append(datasetId,'"+newdatasetID+"') WHERE projectId = '"+projectID+"'");
		res.send(req.files);
	}
	catch(err){
		console.error(err.message);
	}
});

router.put('/dashboard/:projectID/datasets',authenticateJWT, async(req,res) => {
	try{
		var projectID = req.params.projectID;
		req.session.datafile_id1 = selection(); //(selection button)
		let link = `/dashboard/${projectID}/train`;
		res.redirect(`${link}`);
	}
	catch(err){
		console.error(err.message);
	}
});
router.get('/dashboard/:projectID/networkcodes', authenticateJWT, async(req,res) => {
	try{
		var projectID = req.params.projectID;
		var allnetworks = await pool.query("SELECT networkId,name FROM Networks where projectId='"+projectID+"'");  
		res.json(allnetworks.rows);
	}
	catch(err){
		console.error(err.message);
	}
});

router.delete('/dashboard/:projectID/networkcodes/:networkId', authenticateJWT, async(req,res) =>{
	try{
		var projectID = req.params.projectID;
		var networkID= req.params.networkId;
		var alldatasets = await pool.query("DELETE FROM networks where networkId='"+networkId+"'");
		var deleteproject = await pool.query("UPDATE project SET networkId= array_remove(networkId, '"+networkId+"') WHERE projectId = '"+projectID+"'");
		res.json("deleted");
	}
	catch(err){
		console.error(err.message);
	}
});

router.post('/dashboard/:projectID/networkcodes', upload.fields(
	[
        {
            name: 'test_data' ,
            maxCount : 10
        } ,
        {
        	name : 'userfile' ,
        	maxCount : 10
        }
    ]),  async(req,res) =>{
	try{
		var projectID = req.params.projectID;
		var netname= req.body.netname;
		var networkID = uuidv4();
		var parsedId= uuidParse(networkID);
		var networkID= uuidStringify(parsedId);
		console.log(netname);
		var i;
		const networks = req.files['userfile'];
		var originalnames = networks.map(file => file.originalname);
		var filepaths = networks.map(file => file.path);
		var filesizes = networks.map(file => file.size);
		var filetypes = networks.map(file => file.mimetype);
		var tablefile=[];
		var datetime=  new Date();
		var timing = datetime.toISOString().slice(0,10);
		var options = { hour12: false };
		timing += ' ';
		timing += datetime.toLocaleTimeString('en-US',options);
		for(i=0;i<req.files['userfile'].length;i++)  
		{
			var dfile_id = uuidv4();
			var parsedId= uuidParse(dfile_id);
			var dfile_id= uuidStringify(parsedId);
			var originalname = originalnames[i];
			var filepath = filepaths[i];
			var filesize = filesizes[i]; var filetype= filetypes[i]; 
			var newfile= await pool.query("INSERT INTO File (fileId,fileName,path,fileSize,fileType,createdOn) VALUES ('"+dfile_id+"','"+originalname+"','"+filepath+"','"+filesize+"','"+filetype+"','"+timing+"')");
            tablefile.push(`${dfile_id}`);
		}
		var newnetwk = await pool.query(
			"INSERT INTO Networks (networkId, projectId,name) VALUES ('"+networkID+"', '"+projectID+"', '"+netname+"')"); 
		newnetwk = await pool.query("UPDATE Networks SET fileId=array_append(fileId,'"+tablefile+"') WHERE networkId='"+networkID+"'");
		var projectupdate = await pool.query("UPDATE PROJECT SET networkId = array_append(networkId,'"+networkID+"') WHERE projectId='"+projectID+"'");
		res.json(req.files);
	}
	catch(err){
		console.error(err.message);
	}
});

router.put('/dashboard/:projectID/networkcodes', authenticateJWT, async(req,res) => {
	try{
		var projectID= req.params.projectID;
		req.session.network_id1 = selection(); // selection
		let trainlink = `/dashboard/${projectID}/train`;
		res.redirect(`${trainlink}`);
	}
	catch(err){
		console.error(err.message);
	}
}); 

//selection of dataset and network code
router.get('/dashboard/:projectId/train' , authenticateJWT , async(req,res) => {
	try{
	var projectID = req.params.projectId;
	let trlink = `/dashboard/${projectID}/train/${req.session.network_id1}`;
	req.session.datafile_id1.forEach((x) => {
		   trlink += `/${x}`;
		});
	res.redirect(`${trlink}`);
	}
	catch(err){
		console.error(err.message);
	}
});

router.get('/dashboard/:projectId/train/:ntwkfile_id/(:datafile_id)*', async (req,res) =>{
	try{
		var projectID= req.params.projectId;
		var nfile_id = req.params.ntwkfile_id;
		var dfile_id = [req.params.datafile_id].concat(req.params[0].split('/').slice(0));
		req.session.direction = req.body.direction;
		req.session.nametrain = req.body.nametrain;

		var dfiles=[];
		for(var i=1; i<dfile_id.length; i++){
			var idfile_id = dfile_id[i];
			var idatasetname;
			if(i==1) idatasetname= dfile_id[0]+dfile_id[1];
			else idatasetname = dfile_id[i];
			dfiles.push(`${idatasetname}`)
		}
		var filen = uuidv4();
		var parsedId= uuidParse(filen);
	    req.session.filename = uuidStringify(parsedId); //changed
		req.session.logfilename = req.session.filename + '.log'; 
		var logfile_id = uuidv4();
		var parsedId= uuidParse(logfile_id);
		var logfile_id= uuidStringify(parsedId);
		var logpath = `./uploads/${projectID}/${req.session.logfilename}`; 
		
		console.log("1");  
		req.session.studyfile = req.session.filename + '.pkl';
		var studyfile_id = uuidv4();
		var parsedId= uuidParse(studyfile_id);
		var studyfile_id=uuidStringify(parsedId);
		var studypath = `./uploads/${projectID}/${req.session.studyfile}`; 
		
		console.log("2");
		var datetime=  new Date();
		var timing = datetime.toISOString().slice(0,10);
		var options = { hour12: false };
		timing += ' ';
		timing += datetime.toLocaleTimeString('en-US',options);
		fs.open(logpath , 'w', function(err , file){
			if(err) {
				console.log("logfile error");
				throw err;
			}
			console.log('Saved file!');
		});

		fs.open(studypath , 'w', function(err , file){
			if(err) throw err;
			console.log('Saved file!');
		});
		var logstats = fs.statSync(`${logpath}`);
		var logSize = logstats.size;
		var logext = '.log';
		var studystats = fs.statSync(`${studypath}`);
		var studySize = studystats.size;
		var studyext = '.pkl';
		var newfile1= await pool.query("INSERT INTO File (fileId,fileName,path,fileSize,fileType,createdOn) VALUES ('"+logfile_id+"','"+req.session.logfilename+"','"+logpath+"','"+logSize+"','"+logext+"','"+timing+"')");
		var newfile2= await pool.query("INSERT INTO File (fileId,fileName,path,fileSize,fileType,createdOn) VALUES ('"+studyfile_id+"','"+req.session.studyfile+"','"+studypath+"','"+studySize+"','"+studyext+"','"+timing+"')");

		var savedModels= `./uploads/${projectID}/${req.session.filename}`;
		var nametrainPath = `uploads.${req.params.projectId}.${req.session.nametrain}`;
		var savedModelsSecond = savedModels+"/";
		var pathOfLogfile = `./uploads/${projectID}/${req.session.logfilename}`;
		var pathOfStudyfile = `./uploads/${projectID}/${req.session.studyfile}`;
		fs.mkdir(`./uploads/${projectID}/${req.session.filename}`, (err) => {
    		if (err) {
        	return console.error(err);
    		}
    		console.log(req.session.filename);
    		console.log('Directory created successfully!');
		});
		console.log("entering spawn");
		var child = spawn('python', ["train.py", `${req.session.filename}`, `${req.session.direction}`, `${nametrainPath}`, `${savedModelsSecond}`, `${pathOfLogfile}`, `${pathOfStudyfile}`] );
		var out="";
        //handle error in creation of process
        child.on('error',(err) => {
        	console.log(' failed to start  child process ' + err);
        });

        child.stdout.on('data', (data) => {
		  console.log(`stdout: ${data}`);
		  out+=data.toString();
		});
		
		child.stderr.on('data', (data) => {
		  console.error(`stderr: ${data}`);
		});
		console.log("spawned");
        var processID = child.pid;
        console.log("intrin",processID);
        var running = "";
        if(child.exitCode == null) running = "running";

        processDict[processID] = child;

		var newlogfile = await pool.query( 
			"INSERT INTO logs (path, processId, networkId, projectId, status ) VALUES ('"+logpath+"', '"+processID+"', '"+nfile_id+"', '"+projectID+"', '"+running+"')");
		newlogfile = await pool.query("UPDATE logs SET datasetId = array_append(datasetId,'"+dfiles+"') WHERE projectId='"+projectID+"'");
		
		child.on('SIGTERM' , async(code) => {
			console.log('child process terminated');
			var logupdate = await pool.query("UPDATE logs SET status='killed' where processId='"+processID+"'");
		});
		var directory = `./uploads/${projectID}`;
		// fs.watch(`${dir}`, (eventType, filenamewatch) => { 
  //           if(eventType === 'rename')
  //           {
  //               newfilewatch = filenamewatch;
  //               directory = `./uploads/${projectID}/${newfilewatch}`;
  //           }
  //       }); 
        
		child.on('exit' , async(code , signal) => {
			if(code==0){ 
				console.log(`child process was successfully exited with code ${code}`); 
				running = "successfull";
				var logupdate = await pool.query("UPDATE logs SET status='"+running+"' where processId='"+processID+"'");
				var evalid = uuidv4();
				var parsedId= uuidParse(evalid);
				var evalid= uuidStringify(parsedId);
				var netname = await pool.query("SELECT name from networks where networkId='"+nfile_id+"'");
				var dname=[];
				for(var i=0; i<dfile_id.length; i++){
					var idfile_id = dfile_id[i];
					var idatasetname = await pool.query("SELECT name from datasets where datasetId='"+idfile_id+"'")
					dname.push(`${idatasetname}`)
				}
				var number= out.indexOf("##");
				var bestTrial = out.substring(number+2);
				bestTrial = bestTrial.trim();
				var ext="";
				// fs.readdir(savedModels, (err, files) => {
  		// 			files.forEach(file => {
    // 					console.log("kkk", file);
    // 					ext = path.extname(file);
    // 					console.log(ext);
  		// 			});
				// });
				filenames = fs.readdirSync(savedModels);
				console.log("\nCurrent directory filenames:");
				filenames.forEach(file => {
				  console.log(file);
				  ext = path.extname(file);
				});
				// await sleep(1000);

				console.log("extval",ext);
				var currentPath = `./uploads/${req.params.projectId}/${req.session.filename}/` + bestTrial+ext;
				// var prevbestModelFile = bestTrial+ ".h5";
				var newdir =  `./uploads/${req.params.projectId}`;
				var bestmodelFile = evalid+ext;
				// var bestmodelFile = evalid+".h5";
				// const currentPath = path.join(__dirname, prevbestModelFile );
				// const currentPath= prevbestModelFile;
				const newPath = path.join(newdir, bestmodelFile);
				console.log(currentPath);
				fs.rename(currentPath, newPath, function(err) {
				  if (err) {
				    throw err
				  } else {
				    console.log("Successfully moved the file!")
				  }
				});
				fs.rmdir(savedModels, { recursive: true }, (err) => {
				    if (err) {
				        throw err;
				    }
				    console.log(`${savedModels} is deleted!`);
				});
				newdir+= "/"+bestmodelFile;
				var predicid = uuidv4();
				parsedId= uuidParse(predicid);
				predicid= uuidStringify(parsedId);
				var fpath = newdir;/*path.join(__dirname, newdir);*/
				var fext = ext;
				console.log(fext);
				var stats = fs.statSync(`${fpath}`)
				var fsize= stats.size;
				var datetime=  new Date();
				timing = datetime.toISOString().slice(0,10);
				options = { hour12: false };
				timing += ' ';
				timing += datetime.toLocaleTimeString('en-US',options);
				var newfile3 = await pool.query("INSERT INTO File (fileId,fileName,path,fileSize,fileType,createdOn) VALUES ('"+predicid+"','"+bestmodelFile+"','"+fpath+"','"+fsize+"','"+fext+"','"+timing+"')");
				var neweval = await pool.query( 
				"INSERT INTO predictions (projectId, path, evaluationId, networkId , networkName, bestModel) VALUES ('"+projectID+"','"+logpath+"', '"+evalid+"', '"+nfile_id+"', '"+netname+"', '"+predicid+"')");
				neweval = await pool.query("UPDATE predictions SET datasetId = array_append(datasetId,'"+dfiles+"') WHERE projectId='"+projectID+"'");
				neweval = await pool.query("UPDATE predictions SET datasetId = array_append(datasetName,'"+dname+"') WHERE projectId='"+projectID+"'");
				// let metriclink = `/dashboard/${projectID}/metrics/${evalid}/${ntwkfile_id}`;

			// 	dfile_id.forEach((x) => {
			// 	    networklink += `/${x}`;
			// 	});
			// 	res.redirect(`${metriclink}`);
			 }
			 
			else console.log(`Child process terminated with code ${code}`);
		})
		res.send('Training completed');
	}
	catch(err){
		console.error(err.message);
	}
});

// button to terminate the process
router.post('/dashboard/:projectId/train/:ntwkfile_id/(:datafile_id)*', async(req,res) => {
	try{
		var projectID= req.params.projectId;
		var nfile_id = req.params.ntwkfile_id;
		var dfile_id = [req.params.datafile_id].concat(req.params[0].split('/').slice(1));
		//var processing=req.session.child;
		var logpath = `./uploads/${projectID}/${req.session.logfilename}`; 
		var childID = await pool.query("SELECT processId FROM logs where path='"+logpath+"'");
		// console.log(childID.rows[0]);
		// console.log("nextl", childID);
		var childIDs = (childID.rows[0].processid).toString();
		childIDs = Number(childIDs);
		console.log("inkill", childIDs);
		// var processing = processDict[childID];
		// processing.kill('SIGTERM');
		ps.kill( childIDs, 'SIGTERM', function( err ) {
		    if (err) {
		        throw new Error( err );
		    }
		    else {
		        console.log( 'Process %s has been killed without a clean-up!', childIDs );
		    }
		});
		var logupdate = await pool.query("UPDATE logs SET status='killed' where processId='"+childIDs+"'");
		res.send('Training Killed!');
	}
	catch(err){
		console.error(err.message);
		// res.redirect(`dashboard/${projectID}/logvisualiser`);
	}
});

// button to restart training process
router.put('/dashboard/:projectId/train/:ntwkfile_id/(:datafile_id)*', async(req,res) =>{
	try{
		var projectID= req.params.projectId;
		var nfile_id = req.params.ntwkfile_id;
		var dfile_id = [req.params.datafile_id].concat(req.params[0].split('/').slice(1));
		var dfiles=[];
		for(var i=1; i<dfile_id.length; i++){
			var idfile_id = dfile_id[i];
			var idatasetname;
			if(i==1) idatasetname= dfile_id[0]+dfile_id[1];
			else idatasetname = dfile_id[i];
			dfiles.push(`${idatasetname}`)
		}
		var logpath = `./uploads/${projectID}/${req.session.logfilename}`; 
		var childID = await pool.query("SELECT processId FROM logs where path='"+logpath+"'");
		var childIDs = (childID.rows[0].processid).toString();
		childIDs = Number(childIDs);
		console.log("inkill", childIDs);
		ps.kill( childIDs, 'SIGTERM', function( err ) {
		    if (err) {
		        throw new Error( err );
		    }
		    else {
		        console.log( 'Process %s has been killed without a clean-up!', childIDs );
		    }
		});
		var logupdate = await pool.query("UPDATE logs SET status='running' where processId='"+childIDs+"'");
		var idupdate = await pool.query("UPDATE logs SET processId = '"+childIDs+"' where path = '"+logpath+"'");
		var savedModels= `./uploads/${projectID}/${req.session.filename}`;
		var nametrainPath = `uploads.${req.params.projectId}.${req.session.nametrain}`;
		var savedModelsSecond = savedModels+"/";
		var pathOfLogfile = `./uploads/${projectID}/${req.session.logfilename}`;
		var pathOfStudyfile = `./uploads/${projectID}/${req.session.studyfile}`;
		var child = spawn('python', ['resume.py', `${req.session.filename}`, `${req.session.direction}`, `${nametrainPath}`, `${savedModelsSecond}`, `${pathOfLogfile}`, `${pathOfStudyfile}`] );
		var processID = child.pid
		var running = "";
        if(child.exitCode == null) running = "running";

		var out="";
		child.on('error',(err) => {
        	console.log(' failed to start  child process ' + err);
        });

        child.stdout.on('data', (data) => {
		  console.log(`stdout: ${data}`);
		  out+=data.toString();
		});

		child.stderr.on('data', (data) => {
		  console.error(`stderr: ${data}`);
		});
        child.on('SIGTERM' , async(code) => {
			console.log('child process terminated');
			var logupdate = await pool.query("UPDATE logs SET status='killed' where processId='"+processID+"'");
		});

        var dir= `./uploads/${projectID}`;
		var directory = `./uploads/${projectID}`;
        //handles the final exit of process
		child.on('exit' , async(code , signal) => {
			if(code==0){ 
				console.log(`child process was successfully exited with code ${code}`); 
			console.log(`child process was successfully exited with code ${code}`); 
				running = "successfull";
				var logupdate = await pool.query("UPDATE logs SET status='"+running+"' where processId='"+processID+"'");
				var evalid = uuidv4();
				var parsedId= uuidParse(evalid);
				var evalid= uuidStringify(parsedId);
				var netname = await pool.query("SELECT name from networks where networkId='"+nfile_id+"'");
				var dname=[];
				for(var i=0; i<dfile_id.length; i++){
					var idfile_id = dfile_id[i];
					var idatasetname = await pool.query("SELECT name from datasets where datasetId='"+idfile_id+"'")
					dname.push(`${idatasetname}`)
				}
				var number= out.indexOf("##");
				var bestTrial = out.substring(number+2);
				bestTrial = bestTrial.trim();
				var ext="";
				// fs.readdir(savedModels, (err, files) => {
  		// 			files.forEach(file => {
    // 					console.log("kkk", file);
    // 					ext = path.extname(file);
    // 					console.log(ext);
  		// 			});
				// });
				filenames = fs.readdirSync(savedModels);
				console.log("\nCurrent directory filenames:");
				filenames.forEach(file => {
				  console.log(file);
				  ext = path.extname(file);
				});
				// await sleep(1000);

				console.log("extval",ext);
				var currentPath = `./uploads/${req.params.projectId}/${req.session.filename}/` + bestTrial+ext;
				// var prevbestModelFile = bestTrial+ ".h5";
				var newdir =  `./uploads/${req.params.projectId}`;
				var bestmodelFile = evalid+ext;
				// var bestmodelFile = evalid+".h5";
				// const currentPath = path.join(__dirname, prevbestModelFile );
				// const currentPath= prevbestModelFile;
				const newPath = path.join(newdir, bestmodelFile);
				console.log(currentPath);
				fs.rename(currentPath, newPath, function(err) {
				  if (err) {
				    throw err
				  } else {
				    console.log("Successfully moved the file!")
				  }
				});
				fs.rmdir(savedModels, { recursive: true }, (err) => {
				    if (err) {
				        throw err;
				    }
				    console.log(`${savedModels} is deleted!`);
				});
				newdir+= "/"+bestmodelFile;
				var predicid = uuidv4();
				parsedId= uuidParse(predicid);
				predicid= uuidStringify(parsedId);
				var fpath = newdir;/*path.join(__dirname, newdir);*/
				var fext = ext;
				console.log(fext);
				var stats = fs.statSync(`${fpath}`)
				var fsize= stats.size;
				var datetime=  new Date();
				timing = datetime.toISOString().slice(0,10);
				options = { hour12: false };
				timing += ' ';
				timing += datetime.toLocaleTimeString('en-US',options);
				var newfile3 = await pool.query("INSERT INTO File (fileId,fileName,path,fileSize,fileType,createdOn) VALUES ('"+predicid+"','"+bestmodelFile+"','"+fpath+"','"+fsize+"','"+fext+"','"+timing+"')");
				var neweval = await pool.query( 
				"INSERT INTO predictions (projectId, path, evaluationId, networkId , networkName, bestModel) VALUES ('"+projectID+"','"+logpath+"', '"+evalid+"', '"+nfile_id+"', '"+netname+"', '"+predicid+"')");
				neweval = await pool.query("UPDATE predictions SET datasetId = array_append(datasetId,'"+dfiles+"') WHERE projectId='"+projectID+"'");
				neweval = await pool.query("UPDATE predictions SET datasetId = array_append(datasetName,'"+dname+"') WHERE projectId='"+projectID+"'");
				// let metriclink = `/dashboard/${projectID}/metrics/${evalid}/${ntwkfile_id}`;

			// 	dfile_id.forEach((x) => {
			// 	    networklink += `/${x}`;
			// 	});
			// 	res.redirect(`${metriclink}`);
			}
			else console.log(`Child process terminated with code ${code}`);
		})
        res.send('Training resumed.');
	}
	catch(err){
		console.error(err.message);
		// res.redirect(`dashboard/${projectID}/logvisualiser`);
	}
});

router.get('/dashboard/:projectId/logvisualiser', authenticateJWT, async(req,res) =>{
	try{
		server = http.createServer(function(req, res){
			res.writeHead(200, {'Content-Type': 'text/html'})
			fs.readFile(__dirname + '/index.html', function(err, data){
				res.write(data, 'utf8');
				res.end();
			});
		})
		server.listen(8080, '0.0.0.0');

// -- Setup Socket.IO ---------------------------------------------------------

		var io = io.listen(server);

		io.on('connection', function(client){
		  console.log('Client connected');
		  var tail = spawn("tail", ["-f", req.session.logfilename]);
		  client.send( { filename : req.session.logfilename } );

		  tail.stdout.on("data", function (data) {
		    console.log(data.toString('utf-8'))
		    client.send( { tail : data.toString('utf-8') } )
		  }); 

		});

	}
	catch(err){
		console.error(err.message);
	}
});

router.get('/dashboard/:projectId/metrics/:evaluationID/:ntwkfile_id/(:datafile_id)*', upload.fields(
	[
        {
            name: 'test_data' ,
            maxCount : 10
        } ,
        {
        	name : 'userfile' ,
        	maxCount : 10
        }
    ]), async(req,res) =>{
	try{
		var projectID= req.params.projectId;
		console.log(projectID);
		console.log(typeof(projectID));
		var eval_id = req.params.evaluationID;
		var nfile_id = req.params.ntwkfile_id;
		var nametrain = req.body.nametrain;
		var nametrainPath = `uploads.${req.params.projectId}.${nametrain}`;
		var bestmodelidq = await pool.query("SELECT bestModel FROM predictions where evaluationId='"+eval_id+"'");
		var bestmodelid=(bestmodelidq.rows[0].bestmodel).toString();
		// var bestmodelPathq = await pool.query("SELECT fileType FROM File where fileId= '"+bestmodelid+"'");
		// var bestmodelPathq= bestmodelPathq.rows[0].fileType;
		// bestmodelPath= JSON.stringify(bestmodelPath);
		bestmodelPath= eval_id;
		// console.log(bestmodelPathq);
		var confusion = req.body.confusion;
		var path = `./uploads/${req.params.projectId}/${req.params.evaluationID}`;
		var pathConfusion = `./uploads/${req.params.projectId}/${req.session.filename}`
		var dfile_id = [req.params.datafile_id].concat(req.params[0].split('/').slice(1));
		// req.session.filename="9ea9706f-75fb-456d-add1-a01669fe6ca0" //comment later
		//child process
		var description = req.body.description;
		var visible = req.body.visible;
		var addpredic = await pool.query("UPDATE predictions SET modelDescription='"+description+"' , visibility = ' "+visible+"' WHERE evaluationId='"+eval_id+"'");
		var visualprocess = spawn('python', ['metrics.py',`${nametrainPath}`,`${path}`,`${pathConfusion}`, `${confusion}`,`${bestmodelPath}`] );

		 visualprocess.on('error',(err) => {
        	console.log(' failed to start  child process ' + err);
        });

        visualprocess.stdout.on('data', (data) => {
		  console.log(`stdout: ${data}`);
		});

		visualprocess.stderr.on('data', (data) => {
		   console.log(data.toString());
		});

		res.setHeader('Content-Type', 'application/json');
        res.write(JSON.stringify({filename: req.session.filename,projectID:projectID, eval_id: eval_id}));
        res.status(201).end();
	}
	catch(err){
		console.error(err.message);
	}
});
module.exports = router;