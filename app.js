// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_HZh6G1lANxndefWo-uGk4UvGBUHByN4",
  authDomain: "nfctags-d020a.firebaseapp.com",
  projectId: "nfctags-d020a",
  storageBucket: "nfctags-d020a.appspot.com",
  messagingSenderId: "449294593726",
  appId: "1:449294593726:web:3cb918bf857157cd5df8ef",
  measurementId: "G-2NEDEYJMH6",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

document.addEventListener("DOMContentLoaded", async function () {
  console.log("DOM fully loaded and parsed.");

  const borrowForm = document.getElementById("kit-borrow-form");
  const toggleDarkModeButton = document.getElementById("toggle-mode");
  const logoutButton = document.getElementById("logout-button");

  // First, ensure the table is generated
  generateTable();

  // Then, start listening for changes in Firestore documents 0-9
  fetchAndListenToKits();

  // Form submission listener
  if (borrowForm) {
    borrowForm.addEventListener("submit", async function (event) {
      event.preventDefault();

      const kitId = document.getElementById("kit-id").value;
      const studentId = document.getElementById("student-id").value;

      if (!kitId || !studentId) {
        alert("Please enter a valid Kit ID and Student ID");
        return;
      }
      await borrowKit(kitId, studentId);
    });
  }

  // Function to listen for changes in Firestore documents 0-9
  async function fetchAndListenToKits() {
    for (let i = 0; i < 10; i++) {
      db.collection("kits")
        .doc(String(i))
        .onSnapshot((doc) => {
          if (doc.exists) {
            const data = doc.data();
            console.log(`Fetched data for kit ${i}:`, data); // Log fetched data
            updateTableRow(i, data); // Update the corresponding row in the table
          } else {
            console.warn(`Kit document ${i} does not exist.`);
          }
        });
    }
  }

  // Borrow a kit and update Firestore
  async function borrowKit(kitId, studentId) {
    const borrowDuration = 7; // Set borrow duration to 7 days
    const borrowedOn = firebase.firestore.Timestamp.now(); // Firestore's Timestamp
    const returnBy = new Date(
      borrowedOn.toDate().getTime() + borrowDuration * 24 * 60 * 60 * 1000
    ); // 7 days from borrowed date

    try {
      console.log(
        "Attempting to borrow kit with ID:",
        kitId,
        "and Student ID:",
        studentId
      ); // Debugging log

      const kitDoc = await db.collection("kits").doc(kitId).get();

      if (kitDoc.exists) {
        console.warn("This kit already exists in the database.");
        alert(
          "This kit is already in the database. Please choose another kit or return it before borrowing."
        );
        return;
      }

      const newKitData = {
        kitID: kitId,
        studentID: studentId,
        borrowedOn: borrowedOn, // Store Firestore Timestamp
        returnBy: firebase.firestore.Timestamp.fromDate(returnBy), // Firestore Timestamp
        status: "Borrowed",
      };

      console.log("New Kit Data to be written:", newKitData); // Debugging log

      // Write the new kit data to Firestore
      await db.collection("kits").doc(kitId).set(newKitData);
      console.log("Kit successfully borrowed with ID:", kitId);

      // Re-fetch or update the table to reflect the new data
      alert("Kit successfully borrowed for 7 days!");
    } catch (error) {
      console.error("Error adding document:", error); // Log the error
      alert("An error occurred while submitting the kit.");
    }
  }

  // Function to update a specific row in the table
  function updateTableRow(index, kitData) {
    const row = document.getElementById(`kit-row-${index}`);

    row.querySelector(".kit-id").innerText = kitData.kitID || "N/A";
    row.querySelector(".status").innerText = kitData.status || "Available";
    row.querySelector(".student-id").innerText = kitData.studentID || "N/A";

    const epochTime = new Date(0); // January 1, 1970, 00:00:00 UTC

    const borrowedOn = kitData.borrowedOn ? kitData.borrowedOn.toDate() : null;
    const returnBy = kitData.returnBy ? kitData.returnBy.toDate() : null;

    // Display N/A if the borrowedOn date is the epoch time
    row.querySelector(".borrowed-on").innerText =
      borrowedOn && borrowedOn.getTime() !== epochTime.getTime()
        ? borrowedOn.toLocaleString()
        : "N/A";

    // Display N/A if the returnBy date is the epoch time
    row.querySelector(".return-by").innerText =
      returnBy && returnBy.getTime() !== epochTime.getTime()
        ? returnBy.toLocaleString()
        : "N/A";

    const returnButton = row.querySelector(".return-button");
    if (kitData.status === "Borrowed") {
      returnButton.style.display = "inline-block";
      returnButton.onclick = () => returnKit(kitData.kitID); // Use kitData.kitID from Firestore
    } else {
      returnButton.style.display = "none";
    }
  }

  // Function to generate the table
  function generateTable() {
    const tableBody = document.getElementById("kits-table-body");
    if (!tableBody) {
      console.error(
        "Table body not found! Please make sure the HTML structure is correct."
      );
      return;
    }

    for (let i = 0; i < 10; i++) {
      const row = document.createElement("tr");
      row.id = `kit-row-${i}`; // Assign an ID for each row

      row.innerHTML = `
        <td class="kit-id">Loading...</td>
        <td class="status">Loading...</td>
        <td class="student-id">Loading...</td>
        <td class="borrowed-on">Loading...</td>
        <td class="return-by">Loading...</td>
        <td>
          <button class="return-button" style="display: none;">Return</button>
        </td>
      `;

      tableBody.appendChild(row);
    }
  }
});
