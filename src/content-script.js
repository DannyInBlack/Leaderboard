function extractData() {
  const table = document.querySelector("table.standings");
  if (!table) {
    console.error("Standings table not found.");
    return [];
  }
  const timeConversion = [1, 60, 24 * 60];
  const registered = [
    "d19n"
  ]
  
  // Get all table rows, skipping the header row
  const rows = Array.from(table.querySelectorAll("tr")).slice(1);
  
  const standings = rows.map((row) => {
    const columns = row.querySelectorAll("td");
  
    // Invalid row
    if (columns.length === 0) return null;
  
    // Extract relevant data
    const rank = columns[0]?.textContent.trim() || "";
    const username = columns[1]?.querySelector("a")?.textContent.trim() || "";
    const problemsSolved = columns[2]?.textContent.trim() || ""; 
    const penalty = columns[3]?.textContent.trim() || "";
  
    // Invalid row
    if(username == '') return null;

    // Filter out unregistered users
    // if(username == '' || registered.find((user) => user == username) == undefined){
    //   console.log(username + " is unregistered")
    //   return null;
    // }

    // Add each problem status for that user
    const problems = [];
    for(let i = 4; i < columns.length; i++) {
      let problemStatus = columns[i]?.textContent?.trim().split('\n') || [];
      let numAttempts = problemStatus[0];
      let timeRelative = 0;
      
      if(numAttempts == "") { // User didn't attempt the problem
        problems[i - 4] = {
          state: "Not Tried",
          attempts: 0,
          time: timeRelative
        }
        
      } else if(numAttempts[0] == '+') { // User has solved the problem
        let t = (problemStatus[1] || "").trim().split(':').reverse();
        for(let j = 0; j < t.length; j++) { // Convert time from hh?:mm:ss -> seconds 
          timeRelative += timeConversion[j] * parseInt(t[j]);
        }
      
        problems[i - 4] = {
          state: "Solved",
          attempts: numAttempts.length == 1? 1 : parseInt(numAttempts.substring(1)) + 1,
          time: timeRelative
        };
      } else { // Attempted to solve, but failed
        problems[i - 4] = { 
          state: "Attempted",
          attempts: parseInt(numAttempts.substring(1)),
          time: timeRelative
        };
      }
    }
  
    return {
      rank,
      username,
      penalty,
      problemsSolved,
      problems,
      timestamp: new Date().toISOString() // Add timestamp for when data was collected
    };
  });
  

  return standings.filter(Boolean); // Filter out null entries
}

// Get contest ID from URL (e.g., https://codeforces.com/contest/1234/standings)
function getContestId() {
  const match = window.location.pathname.match(/\/contest\/(\d+)/);
  return match ? match[1] : null;
}

// Main execution
const filteredStandings = extractData();
const contestId = getContestId();

if (!contestId) {
  console.error("Could not extract contest ID from URL");
} else {
  chrome.runtime.sendMessage(
    {
      action: "saveData",
      payload: { contestId, standings: filteredStandings }
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        return;
      }
      if (response?.success) {
        console.log("Data saved to Firebase!");
      } else {
        console.error("Failed to save data:", response?.error || "Unknown error");
      }
    }
  );
}