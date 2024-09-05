document.addEventListener("DOMContentLoaded", function () {
  const toggleModeButton = document.getElementById("toggle-mode");
  const modeIcon = document.getElementById("mode-icon");

  // Load saved mode from localStorage
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    modeIcon.classList.replace("fa-moon", "fa-sun"); // Set sun icon for dark mode
  } else {
    document.body.classList.add("light-mode");
    modeIcon.classList.replace("fa-sun", "fa-moon"); // Set moon icon for light mode
  }

  // Toggle between dark and light mode
  toggleModeButton.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    document.body.classList.toggle("light-mode");

    if (document.body.classList.contains("dark-mode")) {
      localStorage.setItem("theme", "dark");
      modeIcon.classList.replace("fa-moon", "fa-sun"); // Switch to sun icon
    } else {
      localStorage.setItem("theme", "light");
      modeIcon.classList.replace("fa-sun", "fa-moon"); // Switch to moon icon
    }
  });

  // Define an array of kits with their initial status
  const kits = [
    { kitId: "0", status: "Available" },
    { kitId: "1", status: "Available" },
    { kitId: "2", status: "Available" },
    { kitId: "3", status: "Available" },
    { kitId: "4", status: "Available" },
    { kitId: "5", status: "Available" },
    { kitId: "6", status: "Available" },
    { kitId: "7", status: "Available" },
    { kitId: "8", status: "Available" },
    { kitId: "9", status: "Available" },
  ];

  // Handle the login form submission if on the login page
  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", function (e) {
      e.preventDefault();

      const username = document
        .getElementById("login-username")
        .value.toLowerCase(); // case-insensitive
      const password = document.getElementById("login-password").value;

      // Check if username and password are correct
      if (username === "admin" && password === "admin123") {
        alert("Login successful!");
        window.location.href = "data.html"; // Redirect to the kit management page
      } else {
        alert("Incorrect username or password.");
      }
    });
  }

  // Handle the logout functionality
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", function () {
      alert("Logged out successfully!");
      window.location.href = "index.html"; // Redirect back to the login page
    });
  }

  // Handle the kit borrowing functionality if on the kit management page
  const kitBorrowForm = document.getElementById("kit-borrow-form");
  if (kitBorrowForm) {
    kitBorrowForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Get the values from the form inputs
      const kitId = document.getElementById("kit-id").value;
      const studentId = document.getElementById("student-id").value;
      const borrowDuration = document.getElementById("borrow-duration").value;
      const borrowedOn = new Date();
      const returnBy = new Date(
        borrowedOn.getTime() + borrowDuration * 24 * 60 * 60 * 1000
      );

      // Check if the kit ID is valid (between 0 and 9)
      if (!kits.some((k) => k.kitId === kitId)) {
        alert("Invalid Kit ID. Please enter a number between 0 and 9.");
        return;
      }

      // Get existing data from localStorage
      let borrowedKits = JSON.parse(localStorage.getItem("borrowedKits")) || [];

      // Check if the student has already borrowed a kit
      const existingStudent = borrowedKits.find(
        (k) => k.studentId === studentId
      );
      if (existingStudent) {
        alert(
          "You have already borrowed a kit. Please return it before borrowing another."
        );
        return; // Exit without allowing borrowing
      }

      // Check if the kit is already borrowed
      const existingKit = borrowedKits.find((k) => k.kitId === kitId);
      if (existingKit && existingKit.status === "Borrowed") {
        alert("This kit is already borrowed. Please choose another kit.");
        return; // Exit without processing the borrow
      }

      // Add or update the kit entry
      borrowedKits.push({
        kitId: kitId,
        studentId: studentId,
        borrowedOn: borrowedOn.toISOString(),
        returnBy: returnBy.toISOString(),
        status: "Borrowed",
      });

      // Store updated data back to localStorage
      localStorage.setItem("borrowedKits", JSON.stringify(borrowedKits));

      // Refresh the table to include the new entry
      renderTable();

      // Clear the form after submission
      document.getElementById("kit-borrow-form").reset();
    });
  }

  // Function to render the table based on localStorage data
  function renderTable() {
    const kitsTable = document
      .getElementById("kits-table")
      .getElementsByTagName("tbody")[0];
    kitsTable.innerHTML = ""; // Clear the table before rendering

    let borrowedKits = JSON.parse(localStorage.getItem("borrowedKits")) || [];

    // Reset kits status
    kits.forEach((kit) => (kit.status = "Available"));

    borrowedKits.forEach(function (kit) {
      const matchedKit = kits.find((k) => k.kitId === kit.kitId);
      if (matchedKit) {
        matchedKit.status = "Borrowed";
        matchedKit.studentId = kit.studentId;
        matchedKit.borrowedOn = kit.borrowedOn;
        matchedKit.returnBy = kit.returnBy;
      }

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
      studentIdCell.innerText = kit.studentId || "";
      borrowedOnCell.innerText = kit.borrowedOn
        ? new Date(kit.borrowedOn).toLocaleString()
        : "";
      returnByCell.innerText = kit.returnBy
        ? new Date(kit.returnBy).toLocaleString()
        : "";

      // Create and append the "Return" button for borrowed kits
      if (kit.status === "Borrowed") {
        const returnButton = document.createElement("button");
        returnButton.innerText = "Return";
        returnButton.addEventListener("click", function () {
          removeEntry(kit.kitId);
        });
        removeCell.appendChild(returnButton);
      }
    });

    // Render any remaining kits that are available
    kits.forEach((kit) => {
      if (kit.status === "Available") {
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
        studentIdCell.innerText = "";
        borrowedOnCell.innerText = "";
        returnByCell.innerText = "";

        removeCell.innerHTML = ""; // No remove button for available kits
      }
    });
  }

  // Function to remove an entry from the data
  function removeEntry(kitId) {
    let borrowedKits = JSON.parse(localStorage.getItem("borrowedKits")) || [];
    borrowedKits = borrowedKits.filter((kit) => kit.kitId !== kitId); // Remove the entry by Kit ID
    localStorage.setItem("borrowedKits", JSON.stringify(borrowedKits)); // Update localStorage

    renderTable(); // Re-render the table
  }

  // Load existing data and render the table when on data.html
  if (document.getElementById("kits-table")) {
    renderTable();
  }
});
