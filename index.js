var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB || window.shimIndexedDB;
var database = "usersDB";
const DB_STORE_NAME = 'users';
const DB_VERSION = 1;
var db;
var opened = false;
const EDIT_USER = "Edit user";
const NEW_USER = "New user";
const ADD_USER = "Add user";

/**
 * openCreateDb
 * opens and/or creates an IndexedDB database
 */
function openCreateDb(onDbCompleted) {

  if(opened){
    db.close();
    opened = false;
  }
  //We could open changing version ..open(database, 3)
  var req = indexedDB.open(database, DB_VERSION);

  //This is how we pass the DB instance to our var
  req.onsuccess = function (e) {
    db = this.result; // Or event.target.result
    console.log("openCreateDb: Databased opened " + db);
    opened = true;

    //The function passed by parameter is called after creating/opening database
    onDbCompleted(db);

  };
  
  // Very important event fired when
  // 1. ObjectStore first time creation
  // 2. Version change
  req.onupgradeneeded = function() {
        
    //Value of previous db instance is lost. We get it back using the event
    db = req.result; //Or this.result

    console.log("openCreateDb: upgrade needed " + db);
    var store = db.createObjectStore(DB_STORE_NAME, { keyPath: "id", autoIncrement: true});
    console.log("openCreateDb: Object store created");

    store.createIndex('fname', 'fname', { unique: false });
    console.log("openCreateDb: Index created on fname");
    store.createIndex('lname', 'lname', { unique: false });
    console.log("openCreateDb: Index created on lname");
    store.createIndex('dni', 'dni', { unique: false });
    console.log("openCreateDb: Index created on dni");
  };

  req.onerror = function (e) {
    console.error("openCreateDb: error opening or creating DB:", e.target.errorCode);
  };
}

function sendData(){

  openCreateDb(function(db){
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

  // Start a new transaction in readwrite mode. We can use readonly also
  var tx = db.transaction(DB_STORE_NAME, "readwrite");  
  var store = tx.objectStore(DB_STORE_NAME);

  try {
    // Inserts data in our ObjectStore
    req = store.add(obj);
  } catch (e) {
    console.log("Catch");
  }

  req.onsuccess = function (e) {
    console.log("addUser: Data insertion successfully done. Id: " + e.target.result);
    
    // Operations we want to do after inserting data
    readData();
    clearFormInputs();
    
  };
  req.onerror = function(e) {
    console.error("addUser: error creating data", this.error);   
  };

  //After transaction is completed we close de database
  tx.oncomplete = function() {
    console.log("addUser: transaction completed");
    db.close();
    opened = false;
  };
}

function readData(){
  openCreateDb(function(db){
    readUsers(db);
  });
}

// Reads all the records from our ObjectStore
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
      //Operations to do after reading all the records
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

  openCreateDb(function(db){
    console.log(db);
    console.log("Id user: " + user_id);

    var tx = db.transaction(DB_STORE_NAME, "readonly"); 
    var store = tx.objectStore(DB_STORE_NAME);

    // Reads one record from our ObjectStore
    var req = store.get(parseInt(user_id));
    
    req.onsuccess = function(e){
      var record = e.target.result;
      console.log(record);  
      
      //Operations to do after reading a user
      updateFormInputsToEdit(record);
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
  
  openCreateDb(function(db){
    console.log(user_id);
    var tx = db.transaction(DB_STORE_NAME, "readwrite"); 
    var store = tx.objectStore(DB_STORE_NAME);

    //Delete data in our ObjectStore
    var req = store.delete(parseInt(user_id));

    req.onsuccess = function(e){
      
      console.log("deleteUser: Data successfully removed: " + user_id);  

      //Operation to do after deleting a record
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

  //Updates data in our ObjectStore
  req = store.put(obj);

  req.onsuccess = function (e) {
    console.log("Data successfully updated");
    
    //Operations to do after updating data
    readData();
    clearFormInputs();    
  };

  req.onerror = function(e) {
    console.error("editUser: Error updating data", this.error);   
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

function updateFormInputsToEdit (record){
  document.getElementById("hiddenId").value = record.id;
  document.getElementById("fname").value = record.fname;
  document.getElementById("lname").value = record.lname;
  document.getElementById("dni").value = record.dni;
  document.getElementById("sendData").innerHTML = EDIT_USER;
  document.getElementById("h1Title").innerHTML = EDIT_USER;
}

window.addEventListener('load', (event) => {
  readData();
});