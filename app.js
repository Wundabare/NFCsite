document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM fully loaded and parsed.");
  const scanNFCButton = document.getElementById('scan-nfc');
  const pasteKey = 'h46WwgDE';  // Your existing Pastebin paste key
  const CORS_PROXY = 'https://api.allorigins.win/get?url=';
  let lastLocalUpdate = new Date();  // Track the last local update time to avoid overwriting

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
  if (scanNFCButton) {
      scanNFCButton.addEventListener('click', startNFCScan);
  }

  // Function to handle borrowing a kit and update both local storage and Pastebin
  async function borrowKit(kitId, studentId) {
      const borrowDuration = 7;  // Default borrow duration is 7 days
      const borrowedOn = new Date();
      const returnBy = new Date(borrowedOn.getTime() + borrowDuration * 24 * 60 * 60 * 1000);

      console.log(`Processing Kit ID: ${kitId}, Student ID: ${studentId}`);

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

      // Add the new borrowing data
      borrowedKits.push({
          kitId: kitId,
          studentId: studentId,
          borrowedOn: borrowedOn.toISOString(),
          returnBy: returnBy.toISOString(),
          status: 'Borrowed'
      });

      // Save to localStorage and update the table
      localStorage.setItem('borrowedKits', JSON.stringify(borrowedKits));
      renderTable();

      // Now update Pastebin with the new borrowed kits data
      await updatePastebin(borrowedKits);

      alert('Kit successfully borrowed for 7 days!');
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
          lastLocalUpdate = new Date();  // Track the local update timestamp
      } catch (error) {
          console.error("Error updating Pastebin:", error);
      }
  }

  // Function to check the paste on Pastebin every 5 seconds and update local data
  setInterval(async function() {
      if (pasteKey) {
          console.log(`Checking paste data for key: ${pasteKey}`);
          try {
              const response = await fetch(`${CORS_PROXY}${encodeURIComponent(`https://pastebin.com/raw/${pasteKey}`)}`);
              const data = await response.json();
              const responseText = data.contents;
              console.log("Raw Pastebin response:", responseText);

              try {
                  const updatedKits = JSON.parse(responseText);  // Ensure it's valid JSON

                  const localKits = JSON.parse(localStorage.getItem('borrowedKits')) || [];

                  // Only update local data if the paste data has changed AND local data wasn't updated recently
                  if (JSON.stringify(updatedKits) !== JSON.stringify(localKits) && new Date() - lastLocalUpdate > 5000) {
                      console.log('Pastebin data has changed. Updating local data...');
                      localStorage.setItem('borrowedKits', JSON.stringify(updatedKits));
                      renderTable(); // Re-render the table with updated data
                  }
              } catch (jsonError) {
                  console.error('Error parsing JSON from Pastebin:', jsonError);
              }
          } catch (fetchError) {
              console.error('Error fetching data from Pastebin:', fetchError);
          }
      } else {
          console.log("Paste key is not available yet.");
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
      console.log("Rendering initial table data...");
      renderTable();
  }
});
