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
const Months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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
const weeklyMap = new Map();
function getWeeklyFormateString(rows, workItemIdsToExclude) {
  rows.map((row) => {
    const workItemId = row["workItemId"];
    if (workItemIdsToExclude.include(workItemId)) {
      return;
    }
    const title = row["title"];
    const comment = row["comment"];
    const date = row["date"];
    let dispString = `[${workItemId}] [${title}] - ${comment}`;
    const weekKey = getWeekRange(date);

    let weeklyArray = weeklyMap.get(weekKey);

    if (weeklyArray == undefined) {
      weeklyMap.set(weekKey, [dispString]);
    } else {
      weeklyArray.push(dispString);
    }
  });
  const sorted = Array.from(weeklyMap.entries()).sort(([keyA], [keyB]) => {
    const startA = new Date(keyA.split("|")[0]).getTime();
    const startB = new Date(keyB.split("|")[0]).getTime();
    return startA - startB; // ascending
  });
  let markDownString = "";
  for (let i = 0; i < sorted.length; i++) {
    const week = sorted[i];
    const times = week[0].split("|");
    const start = new Date(times[0]);
    const end = new Date(times[1]);
    markDownString += `\n ## Week ${Months[start.getMonth()]} ${start.getDate()} ${start.getFullYear()} - ${Months[end.getMonth()]} ${end.getDate()} ${end.getFullYear()}\n`;
    const works = week[1];
    works.forEach((taskString) => {
      markDownString += `\n - ${taskString}\n`;
    });
  }
  return markDownString;
}
function getWeekRange(dateInput) {
  const date = new Date(dateInput);
  const day = date.getDay(); // 0 (Sun) → 6 (Sat)

  // Convert Sunday (0) to 7 for ISO consistency
  const isoDay = day === 0 ? 7 : day;

  const start = new Date(date);
  start.setDate(date.getDate() - isoDay + 1); // Monday
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday
  end.setHours(23, 59, 59, 999);

  return `${start.toISOString()}|${end.toISOString()}`;
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
function parseIds() {
  const raw = document.getElementById("taskInput").value;

  const ids = raw
    .split(/[\s,]+/) // split by space, comma, newline
    .map((s) => s.trim())
    .filter(Boolean);
  return ids ?? [];
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
updateWeeklyPreview(parsed);
{
  const md = getWeeklyFormateString(parsed);
  // Update UI
  const outputDiv = document.getElementById("output");
  if (outputDiv) {
    outputDiv.innerHTML = marked.parse(md);
  }
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
