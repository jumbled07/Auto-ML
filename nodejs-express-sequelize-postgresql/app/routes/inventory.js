var express = require('express');
var router = express.Router();
var pool = require('../db/dev/pool');
var bodyParser = require('body-parser');
var fs = require('fs'); 
const virtualFs = new (require('memfs').Volume)();
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

router.get('/inventory/in/:eval_id', async(req,res)=>{
    res.sendfile('inventory.html');
})

 router.get('/inventory' , async(req,res) => {
    try
    {
        var vis = "Yes";
        var eid = "6304c4ec-94bb-4c3a-b5d8-0e533f5dd7eb";
        var up = await pool.query("UPDATE Predictions SET visibility = '"+vis+"' where evaluationId='"+eid+"' "); 
        var models = await pool.query("SELECT * FROM Predictions where visibility = '"+vis+"' ");
        var result = models.rows;
        // res.json(models.rows);
        // fs.writeFile ("people.txt", JSON.stringify(models), function(err) {
        //     if (err) throw err;
        //     console.log('complete');
        //     }
        // );
        console.log("hello")
        res.status(200).json(result);
        // res.sendfile('inventory.html', {result:result});
    }
    catch(err)
    {
        console.error(err.message);
    }
 });
// Function to hide the loader

 router.get('/inventory/:eval_id' ,async(req,res) => {
    try{
        var evalID = req.params.eval_id;
        var customer_id = uuidv4();
        var parsedId= uuidParse(customer_id);
        req.session.customer_id= uuidStringify(parsedId);
        console.log(customer_id);
        var chosen = await pool.query("SELECT * FROM Predictions where evaluationiD = '"+evalID+"' ");
        res.status(200).json(chosen);
    }
    catch(err)
    {
        console.error(err.message);
    }
 });


router.get('/inventory/:eval_id/testInput' , async(req,res) => {
    res.sendfile("fileupload.html")
});

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
   

 });

 router.get('/inventory/:eval_id/testing' , async(req,res) => {
    try{
        //var modelID = await pool.query("SELECT bestmodelID FROM Predictions where eval_id= '"+evalID+"'");
        //var model = await pool.query("SELECT path FROM File where fileId='"+modelID+"'");
        //console.log("1");
        var evalID = req.params.eval_id;
        var bestmodelidq = await pool.query("SELECT bestModel FROM predictions where evaluationId='"+evalID+"'");
		var bestmodelid=(bestmodelidq.rows[0].bestmodel).toString();
		//console.log("2");
		var bestmodelPathq = await pool.query("SELECT path FROM File where fileId= '"+bestmodelid+"'");
		var bestmodelPath= (bestmodelPathq.rows[0].path).toString();
		// bestmodelPath= JSON.stringify(bestmodelPath);
		//console.log("3");

        //uploads/customerid
        var dir = `./uploads/${req.session.customer_id}`;
        var testID = await pool.query("SELECT testFileId FROM Predictions where evaluationId = '"+evalID+"'");
        var testFile = await pool.query("SELECT path FROM File where fileId = '"+testID+"'");
        //console.log("4");
        var before=[];
        var after=[];
        var fsdir = `./uploads/${req.session.customer_id}`;

        // virtualFs.readdirSync(fsdir, (err, files) => {
        //          files.forEach(file => {
        //              before.push(file);
        //           });
        //          });
        // fs.readdir(fsdir)
        // .then(function(err,items) {
        //     items.map((file) => {
        //         before.push(file); // fileList is ready here! do whatever you want before it resolves to caller
        //     });
        // })
        // .catch(function(e) {
        //     // something bad happened; throw error or handle it as per your needs
        //     throw new Error(e);
        // });
        before = fs.readdirSync(fsdir, {withFileTypes: true}).map(item => item.name);
        console.log("done");
        console.log(before);

        var projectIDq = await pool.query("SELECT projectId from Predictions where evaluationId = '"+evalID+"'");
        var projectID = (projectIDq.rows[0].projectid).toString();
        // projectID = JSON.stringify(projectID);
        console.log(projectID);
        var path= `./uploads/${projectID}/test.py`
        var child = spawn('python', [`${path}`,`${evalID}`,`${dir}`] );

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
				after = fs.readdirSync(fsdir, {withFileTypes: true}).map(item => item.name);
				var difference = after.filter(x => !before.includes(x));
				console.log(difference);
				res.write(JSON.stringify({ newfiles: difference, fsdir: fsdir}));
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
