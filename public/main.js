// main.js

// Your web app's Firebase configuration
var firebaseConfig = {
    apiKey: "AIzaSyAkDDf0Ry4pbAbaZkZPZ6eiKOCf0ELG6Ag",
    authDomain: "worlddominationgameroen.firebaseapp.com",
    projectId: "worlddominationgameroen",
    storageBucket: "worlddominationgameroen.appspot.com",
    messagingSenderId: "738029716231",
    appId: "1:738029716231:web:d7051b55db16bf3dda7ba2",
    measurementId: "G-BR7WE3YE0Q"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
let db = firebase.firestore();

// Initialize the GameManager
const gameManager = new GameManager();
