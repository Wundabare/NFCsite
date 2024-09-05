document.addEventListener('DOMContentLoaded', function() {
  const scanNFCButton = document.getElementById('scan-nfc');
  const kitIdInput = document.getElementById('kit-id');

  // NFC Reading Setup (Requires Chrome on Android or NFC-supported device)
  async function startNFCScan() {
      try {
          if ('NDEFReader' in window) {
              const ndef = new NDEFReader();
              await ndef.scan();
              console.log("NFC scan started. Tap NFC tag to read Kit ID.");

              ndef.onreading = event => {
                  const decoder = new TextDecoder();
                  for (const record of event.message.records) {
                      const kitId = decoder.decode(record.data);
                      kitIdInput.value = kitId; // Automatically fill Kit ID
                      alert(`Kit ID ${kitId} read from NFC tag`);
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

  // Handle the kit borrowing form submission
  const kitBorrowForm = document.getElementById('kit-borrow-form');
  if (kitBorrowForm) {
      kitBorrowForm.addEventListener('submit', function(e) {
          e.preventDefault();
          
          // Get the values from the form inputs
          const kitId = document.getElementById('kit-id').value;
          const studentId = document.getElementById('student-id').value;
          const borrowDuration = document.getElementById('borrow-duration').value;
          const borrowedOn = new Date();
          const returnBy = new Date(borrowedOn.getTime() + borrowDuration * 24 * 60 * 60 * 1000);

          // Ensure the Kit ID is valid
          if (!kitId || isNaN(kitId) || parseInt(kitId) < 0 || parseInt(kitId) > 9) {
              alert('Invalid Kit ID. Please enter or scan a valid Kit ID.');
              return;
          }

          // Check for existing data in localStorage
          let borrowedKits = JSON.parse(localStorage.getItem('borrowedKits')) || [];

          // Check if the kit is already borrowed
          const existingKit = borrowedKits.find(k => k.kitId === kitId);
          if (existingKit && existingKit.status === 'Borrowed') {
              alert('This kit is already borrowed. Please choose another kit.');
              return; // Exit without processing the borrow
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

          // Clear the form after submission
          document.getElementById('kit-borrow-form').reset();
      });
  }

  // Function to render the table based on localStorage data
  function renderTable() {
      const kitsTable = document.getElementById('kits-table').getElementsByTagName('tbody')[0];
      kitsTable.innerHTML = ''; // Clear the table before rendering

      let borrowedKits = JSON.parse(localStorage.getItem('borrowedKits')) || [];

      borrowedKits.forEach(function(kit) {
          const newRow = kitsTable.insertRow();

          // Insert cells for each column
          const kitIdCell = newRow.insertCell(0);
          const statusCell = newRow.insertCell(1);
          const studentIdCell = newRow.insertCell(2);
          const borrowedOnCell = newRow.insertCell(3);
          const returnByCell = newRow.insertCell(4);
          const removeCell = newRow.insertCell(5);

          // Set the values for each cell
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
