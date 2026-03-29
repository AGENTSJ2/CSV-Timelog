const fieldMapping = {
  minutes: "Minutes",
  user: "User",
  userId: "User Id",
  workItemId: "Work Item Id",
  dateWeek: "Week",
  project: "Project",
  title: "Parent Title",
};

const outputHeaders = [
  "Minutes",
  "User",
  "User Id",
  "Work Item Id",
  "Work Item Title",
  "Date",
  "Week",
  "Type",
  "Comment",
  "Project",
  "Parent Id",
  "Parent Title",
];

function transformToOutputStructure(rows) {
  return rows.map((row) => {
    const transformed = {};

    // 1. Map 1-to-1 fields
    for (const inputKey in fieldMapping) {
      transformed[fieldMapping[inputKey]] = row[inputKey] ?? "";
    }

    // 2. Map composite and custom fields
    const title = row["title"] || "";
    const comment = row["comment"] || "";
    transformed["Work Item Title"] = `[${title}]\n${comment}`.trim();

    transformed["Parent Id"] = row["parentId"] || "";
    transformed["Date"] = row["date"] || "";
    transformed["Type"] = getOutputActivityType(row["type"]);
    transformed["Comment"] = getCommentFromInputType(row["type"]);

    return transformed;
  });
}

function getOutputActivityType(inputType) {
  switch (inputType) {
    case "Meeting":
      return "Meetings";
    case "Development":
      return "Coding";
    case "Testing":
      return "Testing";
    case "Bug Fix":
      return "Coding";
    case "Code Review":
      return "Code Review";
    default:
      return "Coding";
  }
}

function getCommentFromInputType(inputType) {
  return inputType === "Bug Fixing" ? "Bug" : "User Story";
}

function handleProcess() {
  const file = document.getElementById("fileInput").files[0];

  if (!file) {
    alert("Select a CSV file");
    return;
  }

  // Papa Parse handles the file reading directly
  Papa.parse(file, {
    header: true, // Automatically maps values to the first row's headers
    skipEmptyLines: true, // Ignores blank rows at the end of the file
    complete: function (results) {
      try {
        const parsed = results.data;
        const transformed = transformToOutputStructure(parsed);

        // Update UI
        const outputDiv = document.getElementById("output");
        if (outputDiv) {
          outputDiv.textContent = JSON.stringify(transformed, null, 2);
        }

        // Use Papa.unparse to convert JSON back to CSV
        // The `columns` config ensures the columns are strictly ordered
        // as per your outputHeaders array
        const csv = Papa.unparse(transformed, {
          columns: outputHeaders,
          quotes: true, // Safely wraps fields with newlines/commas in quotes
        });

        downloadCSV(csv);
      } catch (err) {
        console.error("Error during transformation/export:", err);
      }
    },
    error: function (error) {
      console.error("Error parsing CSV:", error);
      alert("Failed to parse CSV file.");
    },
  });
}

function downloadCSV(csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "output.csv";
  document.body.appendChild(a);
  a.click();

  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// UI handler
document.getElementById("processBtn").addEventListener("click", handleProcess);
