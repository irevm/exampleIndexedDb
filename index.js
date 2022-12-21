var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
var database = "usersDB";
const DB_STORE_NAME = 'users';
const DB_VERSION = 1;
var db;
const EDIT_USER = "Edit user";
const NEW_USER = "New user";
const ADD_USER = "Add user";
var opened = false;

function openDb(onDbCompleted) {

  if(opened){
    db.close();
    opened = false;
  }
  var req = indexedDB.open(database, DB_VERSION);

  req.onsuccess = function (e) {
    db = this.result;
    console.log("openDb: openDb DONE");
    opened = true;

    onDbCompleted(db);

  };
  req.onerror = function (e) {
    console.error("openDb: error opening DB:", e.target.errorCode);
  };

  // Create the schema
  req.onupgradeneeded = function() {
    console.log("openDb.onupgradeneeded");
    db = req.result;
    var store = db.createObjectStore(DB_STORE_NAME, { keyPath: "id", autoIncrement: true});

    store.createIndex('fname', 'fname', { unique: false });
    store.createIndex('lname', 'lname', { unique: false });
    store.createIndex('dni', 'dni', { unique: false });
  };
}

function sendData(){

  openDb(function(db){
    var hiddenId = document.getElementById("hiddenId").value;
    if (hiddenId == 0){
      addUser(db);
    } else {
      console.log("change user values");
      editUser(db);
    }    
  });
}

function addUser(db){
  var fname = document.getElementById("fname");
  var lname = document.getElementById("lname");
  var dni = document.getElementById("dni");
  var obj = { fname: fname.value, lname: lname.value, dni: dni.value };

  // Start a new transaction
  var tx = db.transaction(DB_STORE_NAME, "readwrite");  //readonly 
  var store = tx.objectStore(DB_STORE_NAME);

  try {
    req = store.add(obj);
  } catch (e) {
    console.log("Catch");
  }

  req.onsuccess = function (e) {
    console.log("Insertion in DB successful");
    
    readData();
    clearFormInputs();
    
  };
  req.onerror = function(e) {
    console.error("addUser error", this.error);
   
  };

  tx.oncomplete = function() {
    console.log("addUser: tx completed");
    db.close();
    opened = false;
  };

}

function readData(){
  openDb(function(db){
    readUsers(db);
  });
}

function readUsers(db) {
  var tx = db.transaction(DB_STORE_NAME, "readonly"); 
  var store = tx.objectStore(DB_STORE_NAME);

  var result = [];
  var req = store.openCursor();
  
  req.onsuccess = function(e){
    var cursor = e.target.result;

    if (cursor) {
      result.push(cursor.value);
      console.log(cursor.value);
      cursor.continue();
    } else {
      console.log("EOF");
      console.log(result);
      addUsersToHTML(result);
    }  
  };

  req.onerror = function(e){
    console.error("readUsers: error reading data:", e.target.errorCode);
  };

  tx.oncomplete = function() {
    console.log("readUsers: tx completed");
    db.close();
    opened = false;
  };
}

function addUsersToHTML(users){
  var ul = document.getElementById("users-ul");

  ul.innerHTML = "";

  for (let i = 0; i < users.length; i++) {
    ul.innerHTML += "<li><span>"+users[i].id+" "+users[i].fname+" "+users[i].lname+" "+users[i].dni+"</span><button user_id="+users[i].id+" id=edit_"+users[i].id+">Edit user</button><button user_id="+users[i].id+" id=delete_"+users[i].id+">Delete user</button></li>";
  }

  for (let i = 0; i < users.length; i++) {
    document.getElementById("edit_"+users[i].id).addEventListener("click", readUser, false);
    document.getElementById("delete_"+users[i].id).addEventListener("click", deleteUser, false);
  }
}

function readUser(e){
  console.log("readUser");
  
  //Both options work
  //var button_id = e.target.id;
  //var user_id = document.getElementById(button_id).getAttribute("user_id");
  var user_id = e.target.getAttribute("user_id");

  openDb(function(db){
    console.log(db);
    console.log(user_id);

    var tx = db.transaction(DB_STORE_NAME, "readonly"); 
    var store = tx.objectStore(DB_STORE_NAME);

    var req = store.get(parseInt(user_id));
    
    req.onsuccess = function(e){
      var record = e.target.result;
      console.log(record);   

      document.getElementById("hiddenId").value = record.id;
      document.getElementById("fname").value = record.fname;
      document.getElementById("lname").value = record.lname;
      document.getElementById("dni").value = record.dni;
      document.getElementById("sendData").innerHTML = EDIT_USER;
      document.getElementById("h1Title").innerHTML = EDIT_USER;

    };

    req.onerror = function(e){
      console.error("readUser: error reading data:", e.target.errorCode);
    };

    tx.oncomplete = function() {
      console.log("readUser: tx completed");
      db.close();
      opened = false;
    };

  });
}

function deleteUser(e){
  console.log("deleteUser");
  var button_id = e.target.id;
  var user_id = document.getElementById(button_id).getAttribute("user_id");
  
  openDb(function(db){
    console.log(user_id);
    var tx = db.transaction(DB_STORE_NAME, "readwrite"); 
    var store = tx.objectStore(DB_STORE_NAME);

    var req = store.delete(parseInt(user_id));

    req.onsuccess = function(e){
      
      console.log("Data successfully removed: "+user_id);   

      readData();

    };

    req.onerror = function(e){
      console.error("deleteUser: error removing data:", e.target.errorCode);
    };

    tx.oncomplete = function() {
      console.log("deleteUser: tx completed");
      db.close();
      opened = false;
    };
  });
}

function editUser(db){
  var idUpdate = document.getElementById("hiddenId");
  var fname = document.getElementById("fname");
  var lname = document.getElementById("lname");
  var dni = document.getElementById("dni");

  var obj = { id: parseInt(idUpdate.value), fname: fname.value, lname: lname.value, dni: dni.value };

  var tx = db.transaction(DB_STORE_NAME, "readwrite");   
  var store = tx.objectStore(DB_STORE_NAME);

  req = store.put(obj);

  req.onsuccess = function (e) {
    console.log("Data successfully updated");
    
    readData();
    clearFormInputs();
    
  };
  req.onerror = function(e) {
    console.error("Error updating data", this.error);
   
  };

  tx.oncomplete = function() {
    console.log("editUser: tx completed");
    db.close();
    opened = false;
  };
}

function clearFormInputs(){
  document.getElementById("hiddenId").value = 0;
  document.getElementById("fname").value = "";
  document.getElementById("lname").value = "";
  document.getElementById("dni").value = "";
  document.getElementById("sendData").innerHTML = ADD_USER;
  document.getElementById("h1Title").innerHTML = NEW_USER;
}

window.addEventListener('load', (event) => {
  readData();
});