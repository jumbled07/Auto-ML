var express = require('express');
var router = express.Router();
var pool = require('../db/dev/pool');
var bodyParser = require('body-parser');
var fs = require('fs'); 
var multer = require('multer');
var spawn = require('child_process').spawn;
var cors = require('cors');
var {
    v4 : uuidv4,
    parse:uuidParse,
    stringify : uuidStringify} = require('uuid');
var session = require('express-session');
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

var storage = multer.diskStorage({ 
    destination: function (req, file, cb) {
    	var dir="";
    	if (file.fieldname === "test_data")
    		dir = `./uploads/${req.session.customer_id}`;
    	else if(!req.params.projectID) dir = `./uploads/${req.params.eval_id}`;
    	else{
			dir = `./uploads/${req.params.projectID}`;}
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

const maxSize = 1000 * 1024 * 1024;  //5mb
var upload = multer({  
    storage: storage, 
    limits: { fileSize: maxSize }, 
    fileFilter: function (req, file, cb){ 
	    if (!file.originalname.match(/\.(txt|py|png|jpg|csv|jpeg|yml)$/)) {
	        return cb(new Error('Wrong file format!'));
           }
    cb(null, true);
        }  
  
  });
 router.post('/dashboard/:projectId/:eval_id/launch' , upload.fields(
    [
        {
            name: 'tester' ,
            maxCount : 1
        } ,
        {
        	name : 'dimension' ,
        	maxCount : 1
        } ,
        {
            name: 'test_data' ,
            maxCount : 10
        }
    ]),async(req,res) => {
    try{
        var projectID = req.params.projectId;
        console.log(projectID);
        var evalID = req.params.eval_id;
        
        const testing = req.files['tester'];
        const specs = req.files['dimension'];


        var dfile_id3 = uuidv4();
        var parsedId= uuidParse(dfile_id3);
        var dfile_idt= uuidStringify(parsedId);
        var originalname3= testing.map(file => file.originalname)[0];
        var filepath3= testing.map(file => file.path)[0];
        var filesize3=testing.map(file => file.size)[0];
        var filetype3=testing.map(file => file.mimetype)[0];

        var dfile_id2 = uuidv4();
        var parsedId= uuidParse(dfile_id2);
        var dfile_ids= uuidStringify(parsedId);
        var originalname2= specs.map(file => file.originalname)[0];
        var filepath2= specs.map(file => file.path)[0];
        var filesize2=specs.map(file => file.size)[0];
        var filetype2=specs.map(file => file.mimetype)[0];

        var datetime=  new Date();
        var timing = datetime.toISOString().slice(0,10);
        var options = { hour12: false };
        timing += ' ';
        timing += datetime.toLocaleTimeString('en-US',options);

        var newfile3= await pool.query("INSERT INTO File (fileId,fileName,path,fileSize,fileType,createdon) VALUES (dfile_idt,'"+originalname3+"','"+filepath3+"','"+filesize3+"','"+filetype3+"','"+timing+"')");
        var newfile2= await pool.query("INSERT INTO File (fileId,fileName,path,fileSize,fileType,createdon) VALUES (dfile_ids,'"+originalname2+"','"+filepath2+"','"+filesize2+"','"+filetype2+"','"+timing+"')");
        var addpredic = await pool.query("UPDATE predictions SET testFileId = '"+dfile_idt+"' WHERE evaluationId='"+evalID+"'");
        var addpredic2 = await pool.query("UPDATE predictions SET specsFileId = '"+dfile_ids+"' WHERE evaluationId='"+evalID+"'");
        res.status(200).send("Model is launched publicly");
    }
    catch(err)
    {
        console.error(err.message);
    }
 });

 router.get('/inventory' , async(req,res) => {
    try
    {
        var vis = "Yes";
        var models = await pool.query("SELECT * FROM Predictions where visibility = '"+vis+"' ");
        res.json(models.rows);
    }
    catch(err)
    {
        console.error(err.message);
    }
 })

 router.get('/inventory/:eval_id' ,async(req,res) => {
    try{
        var evalID = req.params.eval_id;
        var customer_id = uuidv4();
        var parsedId= uuidParse(customer_id);
        req.session.customer_id= uuidStringify(parsedId);
        console.log(customer_id);
        var chosen = await pool.query("SELECT * FROM Predictions where evaluationiD = '"+evalID+"' ");
        res.status(200).json(chosen.rows);
    }
    catch(err)
    {
        console.error(err.message);
    }
 });

router.get('/inventory/:eval_id/testInput/:customer_id' , async(req,res) => {
    res.sendfile("fileupload.html")
})

 router.post('/inventory/testInput' , upload.fields(
    [
        {
            name: 'tester' ,
            maxCount : 1
        } ,
         {
        	name : 'dimension' ,
        	maxCount : 1
        } ,
        {
            name: 'test_data' ,
            maxCount : 10
        }
    ]),async(req,res) => {
 	try{
 		 // console.log(req.session.customer_id);
 		const testData = req.files['test_data'];
        var originalnames= testData.map(file => file.originalname);
        var filepaths= testData.map(file => file.path);
        var filesizes=testData.map(file => file.size);
        var filetypes= testData.map(file => file.mimetype);
        var datetime=  new Date();
        var timing = datetime.toISOString().slice(0,10);
        var options = { hour12: false };
        timing += ' ';
        timing += datetime.toLocaleTimeString('en-US',options);
        var i;

        for(i=0;i<req.files['test_data'].length;i++)
        {
        	var dfile_id = uuidv4();
			var parsedId= uuidParse(dfile_id);
			var dfile_id= uuidStringify(parsedId);
			var originalname = originalnames[i];
			var filepath = filepaths[i];
			var filesize = filesizes[i]; 
			var filetype= filetypes[i]; 
			var newfile= await pool.query("INSERT INTO File (fileId,fileName,path,fileSize,fileType,createdon) VALUES ('"+dfile_id+"','"+originalname+"','"+filepath+"','"+filesize+"','"+filetype+"','"+timing+"')");
        }
        res.send(req.files['test_data']);
 	}
 	catch(err)
 	{
 		console.error(err.message);
 	}
   

 })

 router.get('/inventory/:eval_id/testing/:customer_id' , async(req,res) => {
    try{
        var evalID = req.params.eval_id;
        var customer_id = req.params.customer_id;
        var modelID = await pool.query("SELECT bestmodelID FROM Predictions where eval_id= '"+evalID+"'");
        var model = await pool.query("SELECT path FROM File where fileId='"+modelID+"'");
        // var model = "F:/Automated-MLpipeline/nodejs-express-sequelize-postgresql/0.pickle";
        var parent_dir = "F:/Automated-MLpipeline/nodejs-express-sequelize-postgresql/";
        parent_dir+= customer_id;
        parent_dir+="/";
        let dir = "./";
        dir+= customer_id;
        var testID = await pool.query("SELECT testFileId FROM Predictions where eval_id = '"+evalID+"'");
        var testFile = await pool.query("SELECT path FROM File where fileId = '"+testID+"'");
        var before=[];
        var after=[];
        var fsdir = dir+ "/";
        before = fs.readdir(fsdir, {withFileTypes: true}).filter(item => !item.isDirectory()).map(item => item.name);
        console.log(before);
        var child = spawn('python', ['test.py',`${model}`,`${dir}`] );

        child.on('error',(err) => {
            console.log(' failed to start  child process ' + err);
        });

        child.stdout.on('data', (data) => {
          console.log(`stdout: ${data}`);
        });
        
        child.stderr.on('data', (data) => {
          console.error(`stderr: ${data}`);
        });
        child.on('exit' , async(code , signal) => {
			if(code==0) {
				after = fs.readdir(fsdir, {withFileTypes: true}).filter(item => !item.isDirectory()).map(item => item.name);
				var difference = after.filter(x => !before.includes(x));
				console.log(difference);
				res.write(JSON.stringify({ newfiles: difference, parent_dir: parent_dir}));
                res.status(200).end();
			}
			else res.status(400).send("error");
		});
    }
    catch(err)
    {
        console.error(err.message);
    }
 });
 module.exports = router;
