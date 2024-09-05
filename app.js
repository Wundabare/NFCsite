document.addEventListener('DOMContentLoaded', async function() {
    console.log("DOM fully loaded and parsed.");
  
    // Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyA_HZh6G1lANxndefWo-uGk4UvGBUHByN4",
        authDomain: "nfctags-d020a.firebaseapp.com",
        projectId: "nfctags-d020a",
        storageBucket: "nfctags-d020a.appspot.com",
        messagingSenderId: "449294593726",
        appId: "1:449294593726:web:3cb918bf857157cd5df8ef",
        measurementId: "G-2NEDEYJMH6"
      };
    const app = firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
  
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const submitButton = document.getElementById('submit-button');
    const toggleDarkModeButton = document.getElementById('toggle-dark-mode');
    const logoutButton = document.getElementById('logout-button');
  
    // Fetch data from Firestore on page load
    await fetchDataFromFirestore();
  
    // Login button event listener
    if (loginForm) {
      loginForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent form from refreshing the page
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
  
        // Simple authentication check
        if (username === 'admin' && password === 'admin123') {
          window.location.href = 'data.html'; // Redirect to data.html upon successful login
        } else {
          alert('Incorrect username or password');
        }
      });
    }
  
    // Submit button event listener for logging kit borrowing
    if (submitButton) {
      submitButton.addEventListener('click', async function() {
        const kitId = document.getElementById('kit-id').value;
        const studentId = document.getElementById('student-id').value;
        if (!kitId || !studentId) {
          alert('Please enter a valid Kit ID and Student ID');
          return;
        }
        await borrowKit(kitId, studentId); // Borrow kit and update Firestore
      });
    }
  
    // Dark mode toggle button event listener
    if (toggleDarkModeButton) {
      toggleDarkModeButton.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode ? 'enabled' : 'disabled');
      });
  
      // Load saved dark mode preference on page load
      const darkMode = localStorage.getItem('darkMode');
      if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
      }
    }
  
    // Logout button event listener
    if (logoutButton) {
      logoutButton.addEventListener('click', function() {
        window.location.href = 'index.html'; // Redirect to login page
      });
    }
  
    // Function to fetch data from Firestore and update local table
    async function fetchDataFromFirestore() {
      try {
        const kitsSnapshot = await db.collection('kits').get();
        const borrowedKits = [];
        kitsSnapshot.forEach(doc => borrowedKits.push(doc.data()));
        renderTable(borrowedKits);
      } catch (fetchError) {
        console.error('Error fetching data from Firestore:', fetchError);
      }
    }
  
    // Function to add or update kit data in Firestore
    async function updateFirestore(kitId, kitData) {
      try {
        await db.collection('kits').doc(kitId).set(kitData);
        console.log(`Kit data successfully written for Kit ID: ${kitId}`);
      } catch (error) {
        console.error("Error updating Firestore:", error);
      }
    }
  
    // Function to handle borrowing a kit and updating Firestore
    async function borrowKit(kitId, studentId) {
      const borrowDuration = 7;  // Default borrow duration is 7 days
      const borrowedOn = new Date();
      const returnBy = new Date(borrowedOn.getTime() + borrowDuration * 24 * 60 * 60 * 1000);
  
      console.log(`Processing Kit ID: ${kitId}, Student ID: ${studentId}`);
  
      // Fetch existing data from Firestore
      const doc = await db.collection('kits').doc(kitId).get();
      const borrowedKits = doc.exists ? doc.data() : {};
  
      // Check if the student or kit is already in use
      if (borrowedKits.studentId && borrowedKits.status === 'Borrowed') {
        alert('This kit is already borrowed. Please choose another kit.');
        return;
      }
  
      // Add the new borrowing data
      const newKitData = {
        kitId: kitId,
        studentId: studentId,
        borrowedOn: borrowedOn.toISOString(),
        returnBy: returnBy.toISOString(),
        status: 'Borrowed'
      };
  
      // Update Firestore and re-render the table
      await updateFirestore(kitId, newKitData);
      await fetchDataFromFirestore();
      alert('Kit successfully borrowed for 7 days!');
    }
  
    // Function to render the table
    function renderTable(borrowedKits) {
      const kitsTable = document.getElementById('kits-table').getElementsByTagName('tbody')[0];
      kitsTable.innerHTML = ''; // Clear the table before rendering
  
      if (borrowedKits.length === 0) {
        const placeholderRow = kitsTable.insertRow();
        const placeholderCell = placeholderRow.insertCell(0);
        placeholderCell.colSpan = 6;
        placeholderCell.textContent = 'No kits borrowed yet';
        placeholderCell.style.textAlign = 'center';
      } else {
        borrowedKits.forEach(function(kit) {
          const newRow = kitsTable.insertRow();
          const kitIdCell = newRow.insertCell(0);
          const statusCell = newRow.insertCell(1);
          const studentIdCell = newRow.insertCell(2);
          const borrowedOnCell = newRow.insertCell(3);
          const returnByCell = newRow.insertCell(4);
          const removeCell = newRow.insertCell(5);
  
          kitIdCell.innerText = kit.kitId;
          statusCell.innerText = kit.status;
          studentIdCell.innerText = kit.studentId || '';
          borrowedOnCell.innerText = new Date(kit.borrowedOn).toLocaleString();
          returnByCell.innerText = new Date(kit.returnBy).toLocaleString();
  
          // Return button to remove entry
          if (kit.status === 'Borrowed') {
            const returnButton = document.createElement('button');
            returnButton.innerText = 'Return';
            returnButton.addEventListener('click', async function() {
              await returnKit(kit.kitId);
            });
            removeCell.appendChild(returnButton);
          }
        });
      }
    }
  
    // Function to return a kit and update Firestore
    async function returnKit(kitId) {
      try {
        await db.collection('kits').doc(kitId).update({
          status: 'Available',
          studentId: null,
          borrowedOn: null,
          returnBy: null
        });
        console.log(`Kit ID ${kitId} returned successfully.`);
        await fetchDataFromFirestore();
      } catch (error) {
        console.error("Error returning kit:", error);
      }
    }
  
  });
