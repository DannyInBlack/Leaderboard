// Copyright 2023 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// This script should first get access to codeforces, then get standings from the offical standings and save it





const table = document.querySelector("table.standings");
if (!table) {
  console.error("Standings table not found.");
}
const timeConversion = [1, 60, 24 * 60];


// Get all table rows, skipping the header row
const rows = Array.from(table.querySelectorAll("tr")).slice(1);

const standings = rows.map((row) => {
  const columns = row.querySelectorAll("td");

  if (columns.length === 0) return null;

  // Extract relevant data
  const rank = columns[0]?.textContent.trim() || "";
  const username = columns[1]?.querySelector("a")?.textContent.trim() || "";
  const problemsSolved = columns[2]?.textContent.trim() || ""; 
  const penalty = columns[3]?.textContent.trim() || "";
  
  problems = Array()
  for(let i = 4; i < columns.length; i++) {
    let problemStatus = columns[i].textContent.trim().split('\n');
    let num = problemStatus[0];
    let x = 0;

    if(num == "") {
      problems[i - 4] = {
        state: "Not Tried",
        attempts: 0,
        time: x
      }
    } else if(num[0] == '+') {
      let t = (problemStatus[1] || "").trim().split(':').reverse();
      for(let j = 0; j < t.length; j++) {
        x += timeConversion[j] * parseInt(t[j]);
      }
    
      problems[i - 4] = {
        state: "Solved",
        attempts: num.length == 1? 1 : parseInt(num.substring(1)),
        time: x
      };
    } else {
      problems[i - 4] = {
        state: "Attmpted",
        attempts: parseInt(num.substring(1)),
        time: x
      };
    }
  }

  if(username == "d19n") return null;

  return {
    rank,
    username,
    penalty,
    problemsSolved,
    problems,
  };
});

const filteredStandings = standings.filter(Boolean);

console.log(filteredStandings);

// Optionally copy the data to the clipboard
// const jsonString = JSON.stringify(filteredStandings, null, 2);
// console.log("Data copied to clipboard:");
// console.log(jsonString);
// navigator.clipboard.writeText(jsonString).catch((err) => {
//   console.error("Failed to copy to clipboard:", err);
// });