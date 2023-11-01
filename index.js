var express = require("express"),
routes = require("./routes"),
user = require("./routes/user"),
http = require("http"),
multer = require('multer');
path = require("path");
fs = require('fs')
var session = require("express-session");
var app = express();
var mysql = require("mysql");
var bodyParser = require("body-parser");
var connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "123456789",
  database: "hivelance",
});

// Multer ayarları
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});


const upload = multer({ storage: storage });


connection.connect();

global.db = connection;

app.set("port", process.env.PORT || 3000);
app.set("views", __dirname + "/views");
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 60000 },
  })
);

app.get("/", routes.index);
app.get("/signup", user.signup);
app.post("/signup", user.signup);
app.get("/login", routes.index);
app.post("/login", user.login);
app.get("/home/dashboard", user.dashboard);

app.get("/home/logout", user.logout);
app.get("/home/profile", user.profile);
app.get("/home/edit_profile", user.edit_profile);
app.post("/home/create_jobs_inSQL", user.create_jobs);
app.post('/home/dashboard/Apply', user.ApplyTheJob);
app.post('/home/otherProfile', user.otherProfile);
app.post("/home/acceptJob",user.acceptJob);
app.post("/home/rejectJob",user.rejectJob);
app.post('/home/UpdateJob',user.UpdateJobPage)
app.post('/home/DeleteJob',user.DeletJob)
app.get("/home/jobs" , user.myjobs_page);
app.get("/home/applications" , (req,res)=>{
  res.render('applications.ejs')
});
app.get("/home/create_job", (req, res) => {
  res.render("create_job.ejs");
});


app.get('/home/download-pdf/:id', (req, res) => {
  var user =  req.session.user;
  var userId = req.session.userId;
  const query = 'SELECT * FROM user_folder WHERE account_id = ?';
  console.log(userId)
  connection.query(query, [userId], (err, result) => {
    if (err) throw err;
    const pdfBuffer = result[0].user_cv; // assuming your PDF data column name is 'pdf'
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=file.pdf');
    res.send(pdfBuffer);
  });
});



// upload function render
app.post('/home/uploads', upload.fields([
  { name: 'pdf', maxCount: 1 },
  { name: 'png', maxCount: 1 },
]), (req, res,next) => {
 
   userId = req.session.userId;
  console.log(req.session.userId);
  const { pdf,png, engineering, minor, Student_or_graduate, University, HighSchool, about_me, Githup_link, Twitter_link, linkedin_link,V_experience } = req.body;
  const pdfBlob = fs.readFileSync(req.files['pdf'][0].path);
  const pngBlob = fs.readFileSync(req.files['png'][0].path); 
  
  

  const sql_user_profile = 'INSERT INTO user_profile (account_id, about_me, v_experience, github_link, twitter_link, linkedin_link) VALUES(?,?,?,?,?,?)' 
  db.query(sql_user_profile,[userId,about_me,V_experience,Githup_link,linkedin_link,Twitter_link],(err,result)=>{
    if (err) throw err;
  });

  const sql_user_skills =  'INSERT INTO user_skills (account_id, job, minor) VALUES(?,?,?)'
  db.query(sql_user_skills,[userId,engineering,minor],(err,result)=>{
    if (err) throw err;
  });

  const sql_user_education = 'INSERT INTO user_education (account_id, education_statues, university_name, school_name) VALUES(?,?,?,?)'
  db.query(sql_user_education,[userId,Student_or_graduate,University,HighSchool],(err,result)=>{
    if (err) throw err;
  });

  const sql_user_folder = 'INSERT INTO user_folder (account_id,profile_photo,user_cv) VALUES(?,?,?)'
  db.query(sql_user_folder,[userId,pngBlob,pdfBlob],(err,result)=>{
      if (err) throw err;
    
    });
    res.render('edit-profile');
});
app.listen(3000);
