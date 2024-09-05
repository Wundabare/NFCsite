document.addEventListener('DOMContentLoaded', async function() {
    console.log("DOM fully loaded and parsed.");
    
    // Pastebin setup
    const pasteKey = 'h46WwgDE';  // Your existing Pastebin paste key
    const CORS_PROXY = 'https://api.allorigins.win/get?url=';
  
    // DOM Elements
    const loginForm = document.getElementById('login-form');
    const submitButton = document.getElementById('submit-button');
    const toggleDarkModeButton = document.getElementById('toggle-dark-mode');
    const logoutButton = document.getElementById('logout-button');
  
    // Fetch data from Pastebin on page load
    await fetchDataFromPastebin();
  
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
        await borrowKit(kitId, studentId); // Borrow kit and update Pastebin
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
  
    // Function to fetch data from Pastebin and update local table
    async function fetchDataFromPastebin() {
      try {
        console.log(`Fetching data from Pastebin for key: ${pasteKey}`);
        const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`https://pastebin.com/raw/${pasteKey}`)}`);
        const data = await response.json();
        const responseText = data.contents;
        console.log("Raw Pastebin response:", responseText);
  
        try {
          const borrowedKits = JSON.parse(responseText);  // Ensure it's valid JSON
          renderTable(borrowedKits); // Re-render the table with fetched data
        } catch (jsonError) {
          console.error('Error parsing JSON from Pastebin:', jsonError);
        }
      } catch (fetchError) {
        console.error('Error fetching data from Pastebin:', fetchError);
      }
    }
  
    // Function to update Pastebin with the latest borrowed kits data
    async function updatePastebin(borrowedKits) {
      const pasteContent = JSON.stringify(borrowedKits, null, 2);
      const formData = new URLSearchParams();
      formData.append('api_dev_key', 'your-pastebin-api-key');  // Replace with your Pastebin API key
      formData.append('api_user_key', 'your-pastebin-user-key');  // Replace with your Pastebin User key
      formData.append('api_option', 'paste');
      formData.append('api_paste_code', pasteContent);
      formData.append('api_paste_private', '1'); // Unlisted
      formData.append('api_paste_name', 'Borrowed Kits Data');
      formData.append('api_paste_expire_date', '1D'); // Paste expires in 1 day
  
      try {
        console.log("Updating Pastebin with new data...");
        const response = await fetch(`https://pastebin.com/api/api_post.php`, {
          method: 'POST',
          body: formData
        });
  
        const pasteUrl = await response.text();
        console.log(`Paste updated: ${pasteUrl}`);
      } catch (error) {
        console.error("Error updating Pastebin:", error);
      }
    }
  
    // Function to handle borrowing a kit and updating Pastebin
    async function borrowKit(kitId, studentId) {
      const borrowDuration = 7;  // Default borrow duration is 7 days
      const borrowedOn = new Date();
      const returnBy = new Date(borrowedOn.getTime() + borrowDuration * 24 * 60 * 60 * 1000);
  
      console.log(`Processing Kit ID: ${kitId}, Student ID: ${studentId}`);
  
      // Fetch existing data from Pastebin
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`https://pastebin.com/raw/${pasteKey}`)}`);
      const data = await response.json();
      const borrowedKits = JSON.parse(data.contents) || [];
  
      // Check if the student or kit is already in use
      const existingStudent = borrowedKits.find(k => k.studentId === studentId);
      if (existingStudent) {
        alert('You have already borrowed a kit. Please return it before borrowing another.');
        return;
      }
  
      const existingKit = borrowedKits.find(k => k.kitId === kitId);
      if (existingKit && existingKit.status === 'Borrowed') {
        alert('This kit is already borrowed. Please choose another kit.');
        return;
      }
  
      // Add the new borrowing data
      borrowedKits.push({
        kitId: kitId,
        studentId: studentId,
        borrowedOn: borrowedOn.toISOString(),
        returnBy: returnBy.toISOString(),
        status: 'Borrowed'
      });
  
      // Update Pastebin and re-render the table
      await updatePastebin(borrowedKits);
      renderTable(borrowedKits);
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
              removeEntry(kit.kitId);
            });
            removeCell.appendChild(returnButton);
          }
        });
      }
    }
  
    // Function to remove an entry from the data and update Pastebin
    async function removeEntry(kitId) {
      const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`https://pastebin.com/raw/${pasteKey}`)}`);
      const data = await response.json();
      let borrowedKits = JSON.parse(data.contents) || [];
  
      borrowedKits = borrowedKits.filter(kit => kit.kitId !== kitId); // Remove the entry by Kit ID
  
      await updatePastebin(borrowedKits); // Update Pastebin with new data
      renderTable(borrowedKits); // Re-render the table
    }
  
  });
  