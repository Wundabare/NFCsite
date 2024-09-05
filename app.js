document.addEventListener('DOMContentLoaded', function() {
  const scanNFCButton = document.getElementById('scan-nfc');
  let pasteKey = '';  // Will hold the Pastebin paste key after it's created

  const PASTEBIN_API_KEY = 'OKC8f3WSNJk1Ugk6MuZbRYJHGWS80vVf'; 
  const PASTEBIN_USER_KEY = 'f2883ad0e7fedcf32d6dce37c11e3588'; 

  // CORS Proxy for handling Pastebin restrictions
  const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';

  // NFC Reading Setup
  async function startNFCScan() {
      try {
          if ('NDEFReader' in window) {
              const ndef = new NDEFReader();
              await ndef.scan();
              console.log("NFC scan started. Tap NFC tag to read Kit ID.");

              ndef.onreading = event => {
                  const decoder = new TextDecoder();
                  for (const record of event.message.records) {
                      const kitId = decoder.decode(record.data); // Get Kit ID from NFC tag
                      console.log(`Kit ID ${kitId} read from NFC tag`);

                      const studentId = prompt("Please enter your Student ID:");

                      if (studentId) {
                          borrowKit(kitId, studentId);
                      } else {
                          alert("Student ID is required to borrow the kit.");
                      }
                  }
              };

              ndef.onreadingerror = () => {
                  console.error("Cannot read NFC tag.");
                  alert("Error reading NFC tag.");
              };
          } else {
              alert("NFC is not supported on this device or browser.");
          }
      } catch (error) {
          console.error(`Error starting NFC scan: ${error}`);
          alert("NFC is not supported on this device or browser.");
      }
  }

  // Event listener for NFC scan button
  scanNFCButton.addEventListener('click', startNFCScan);

  // Function to handle borrowing a kit and create a Pastebin paste
  async function borrowKit(kitId, studentId) {
      const borrowDuration = 7;  // Default borrow duration is 7 days
      const borrowedOn = new Date();
      const returnBy = new Date(borrowedOn.getTime() + borrowDuration * 24 * 60 * 60 * 1000);

      if (isNaN(kitId) || kitId < 0 || kitId > 9) {
          alert('Invalid Kit ID. Please scan a valid NFC tag.');
          return;
      }

      let borrowedKits = JSON.parse(localStorage.getItem('borrowedKits')) || [];

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

      borrowedKits.push({
          kitId: kitId,
          studentId: studentId,
          borrowedOn: borrowedOn.toISOString(),
          returnBy: returnBy.toISOString(),
          status: 'Borrowed'
      });

      localStorage.setItem('borrowedKits', JSON.stringify(borrowedKits));
      await createPasteOnPastebin(borrowedKits);
      renderTable();
      alert('Kit successfully borrowed for 7 days!');
  }

  // Function to create a paste on Pastebin with borrowed kits data
  async function createPasteOnPastebin(borrowedKits) {
      const pasteContent = JSON.stringify(borrowedKits, null, 2);
      const formData = new URLSearchParams();
      formData.append('api_dev_key', PASTEBIN_API_KEY);
      formData.append('api_user_key', PASTEBIN_USER_KEY);
      formData.append('api_option', 'paste');
      formData.append('api_paste_code', pasteContent);
      formData.append('api_paste_private', '1'); // Unlisted
      formData.append('api_paste_name', 'Borrowed Kits Data');
      formData.append('api_paste_expire_date', '1D'); // Paste expires in 1 day

      const response = await fetch('https://pastebin.com/api/api_post.php', {
          method: 'POST',
          body: formData
      });

      const pasteUrl = await response.text();
      console.log(`Paste created: ${pasteUrl}`);
      pasteKey = pasteUrl.split('/').pop(); // Extract the paste key from the URL
  }

  // Function to check the paste on Pastebin every 5 seconds and update data
  setInterval(async function() {
      if (pasteKey) {
          try {
              // Fetch the data from Pastebin with CORS proxy
              const response = await fetch(`${CORS_PROXY}https://pastebin.com/raw/${pasteKey}`);
              const responseText = await response.text();

              try {
                  const updatedKits = JSON.parse(responseText);  // Ensure it's valid JSON

                  // Compare with localStorage to see if there's any change
                  const localKits = JSON.parse(localStorage.getItem('borrowedKits')) || [];
                  if (JSON.stringify(updatedKits) !== JSON.stringify(localKits)) {
                      console.log('Pastebin data has changed. Updating...');
                      localStorage.setItem('borrowedKits', JSON.stringify(updatedKits));
                      renderTable(); // Re-render the table with updated data
                  }
              } catch (jsonError) {
                  console.error('Error parsing JSON from Pastebin:', jsonError);
              }
          } catch (fetchError) {
              console.error('Error fetching data from Pastebin:', fetchError);
          }
      }
  }, 5000); // Check every 5 seconds

  // Function to render the table based on localStorage data
  function renderTable() {
      const kitsTable = document.getElementById('kits-table').getElementsByTagName('tbody')[0];
      kitsTable.innerHTML = ''; // Clear the table before rendering

      let borrowedKits = JSON.parse(localStorage.getItem('borrowedKits')) || [];

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

              if (kit.status === 'Borrowed') {
                  const returnButton = document.createElement('button');
                  returnButton.innerText = 'Return';
                  returnButton.addEventListener('click', function() {
                      removeEntry(kit.kitId);
                  });
                  removeCell.appendChild(returnButton);
              }
          });
      }
  }

  // Function to remove an entry from the data
  function removeEntry(kitId) {
      let borrowedKits = JSON.parse(localStorage.getItem('borrowedKits')) || [];
      borrowedKits = borrowedKits.filter(kit => kit.kitId !== kitId); // Remove the entry by Kit ID
      localStorage.setItem('borrowedKits', JSON.stringify(borrowedKits)); // Update localStorage

      renderTable(); // Re-render the table
  }

  // Load existing data and render the table when on data.html
  if (document.getElementById('kits-table')) {
      renderTable();
  }
});
