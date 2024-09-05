document.addEventListener('DOMContentLoaded', function() {
  const scanNFCButton = document.getElementById('scan-nfc');
  const kitIdInput = document.getElementById('kit-id');
  
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

                      // Prompt the user to enter the Student ID
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

  // Function to handle borrowing a kit
  function borrowKit(kitId, studentId) {
      const borrowDuration = prompt("Enter borrow duration in days (e.g., 3):");
      if (!borrowDuration || isNaN(borrowDuration)) {
          alert("Invalid borrow duration.");
          return;
      }

      const borrowedOn = new Date();
      const returnBy = new Date(borrowedOn.getTime() + borrowDuration * 24 * 60 * 60 * 1000);

      // Validate the Kit ID and ensure it's within 0-9
      if (isNaN(kitId) || kitId < 0 || kitId > 9) {
          alert('Invalid Kit ID. Please scan a valid NFC tag.');
          return;
      }

      // Get existing data from localStorage
      let borrowedKits = JSON.parse(localStorage.getItem('borrowedKits')) || [];

      // Check if the student has already borrowed a kit
      const existingStudent = borrowedKits.find(k => k.studentId === studentId);
      if (existingStudent) {
          alert('You have already borrowed a kit. Please return it before borrowing another.');
          return;
      }

      // Check if the kit is already borrowed
      const existingKit = borrowedKits.find(k => k.kitId === kitId);
      if (existingKit && existingKit.status === 'Borrowed') {
          alert('This kit is already borrowed. Please choose another kit.');
          return;
      }

      // Add or update the kit entry
      borrowedKits.push({
          kitId: kitId,
          studentId: studentId,
          borrowedOn: borrowedOn.toISOString(),
          returnBy: returnBy.toISOString(),
          status: 'Borrowed'
      });

      // Store updated data back to localStorage
      localStorage.setItem('borrowedKits', JSON.stringify(borrowedKits));

      // Refresh the table to include the new entry
      renderTable();
      alert('Kit successfully borrowed!');
  }

  // Function to render the table based on localStorage data
  function renderTable() {
      const kitsTable = document.getElementById('kits-table').getElementsByTagName('tbody')[0];
      kitsTable.innerHTML = ''; // Clear the table before rendering

      let borrowedKits = JSON.parse(localStorage.getItem('borrowedKits')) || [];

      if (borrowedKits.length === 0) {
          // Show placeholder if no entries exist
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

              // Create and append the "Return" button for borrowed kits
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
