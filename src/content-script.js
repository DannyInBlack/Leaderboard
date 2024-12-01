import app from './firebaseInit';
import { getFirestore, setDoc, doc } from 'firebase/firestore';

const db = getFirestore(app);
const timeConversion = [1, 60, 24 * 60]; // [minute to minute, hour to minute, days to minute]

/**
 * Converts time from format {days?:hours:minutes} to minutes
 * @param {str} x column value for time
 * @returns time in minutes
 */
function convertTime(x) {
  let t = 0;
  let str = (x || "").trim().split(':').reverse();
  for (let j = 0; j < str.length; j++) {
    t += timeConversion[j] * parseInt(str[j]);
  }
  return t;
}

/**
 * 
 * @param {str} x The name of the column
 * @returns {boolean} Is the column a problem?
 */
function isProblem(x) {
  return /^[a-zA-Z][0-9]*$/.test(x);
}

/**
 * Extracts data from the current page, updates Firebase, then refreshes after T milliseconds pass
 * @param {int} t Time in milliseconds
 * @returns {void}
 */
function extractData(t) {
  const table = document.querySelector("table.standings");
  if (!table) {
    console.error("Standings table not found.");
    return [];
  }
  // Get all table rows, skipping the header row
  const rows = Array.from(table.querySelectorAll("tr")).slice(1);
  const firstRow = Array.from(table.querySelectorAll("tr")).slice(0, 1)[0].querySelectorAll("th");
  const columnHeaders = {}; // map of every column and it's index
  const problemHeaders = []; // list of problem short names
  let numProblems = 0;
  let contestType = "Time-Based";
  let score = 0; // total score or problems solved
    
  // Extract the column names with their indicies.
  for (let i = 0; i < firstRow.length; i++) {
    let headers = firstRow[i].innerText.split('\n')[0];
    if (isProblem(headers)){
      numProblems++;
      if(contestType == "Time-Based" && firstRow[i].innerText.split('\n').length == 2) {
        contestType = "Score-Based";
      }
    }
    switch (headers) {
      case 'Penalty': headers = "penalty"; break;
      case '=': score = i; continue; break;
      case 'Who': headers = "username"; break;
      case '#': headers = "rank"; break;
      case '*': continue;
      default: problemHeaders.push(headers); break;
    }
    columnHeaders[headers] = i;
  }
  // Different contests have different params
  contestType == "Time-Based"? columnHeaders.problemsSolved = score: columnHeaders.score = score; 
  console.log(columnHeaders);
  
  const standings = rows.map((row) => {
    const columns = row.querySelectorAll("td");
    
    const deck = {};
    deck.problems = [];
    for (let key in columnHeaders) {
      if (isProblem(key)) { // do some logic if column is a problem statement status
        let problemStatus = columns[columnHeaders[key]]?.textContent?.trim().split('\n') || [];
        let numAttempts = problemStatus[0];

        // default values
        let time = 0;
        let state = "Not Tried";
        let attempts = 0;
        
        if(contestType == "Time-Based"){
          if (numAttempts[0] == '+') { // User has solved the problem
            time = problemStatus.length > 1? convertTime(problemStatus[1]) : 0;
            state = "Solved";
            attempts = numAttempts.length == 1 ? 1 : parseInt(numAttempts.substring(1)) + 1;
          } else if (numAttempts[0] == '-') { // Attempted to solve, but failed
            state = "Attempted";
            attempts = parseInt(numAttempts.substring(1));
          }
          deck.problems.push({
            name: key,
            state,
            attempts,
            time
          });
        } else {
          let score = 0;
          if (numAttempts[0] == '-') { // Attempted to solve, but failed
            state = "Attempted";
            attempts = parseInt(numAttempts.substring(1));
          } else if(numAttempts != ""){
            state = "Solved";
            attempts = 0;
            time = problemStatus.length > 1? convertTime(problemStatus[1]) : 0;
            score = parseInt(numAttempts);
          }
          deck.problems.push({
            name: key,
            state,
            score,
            attempts,
            time
          });
        }
      } else if (key == "username") { // extract username
        deck[key] = columns[columnHeaders[key]]?.querySelector("a")?.textContent.trim() || "";
      } else { // extract other columns
        deck[key] = columns[columnHeaders[key]]?.textContent.trim() || "";
      }
    }

    // Mark invalid entries as null
    if(deck.username == "" || deck.rank == "") {
      return null;
    }
    
    return deck; 
  });
               
  // Filter out null entries
  const filteredStandings = standings.filter(Boolean); 
  // Try and find the contest ID from url
  const contestId = window.location.pathname.match(/contest\/(\d+)/)?.[1]; 
  if (!contestId) {
    console.error("Contest ID not found in URL.");
    return;
  }
  // Extract contest name
  const contestName = document.getElementsByClassName("contest-name")[0]?.querySelector("a")?.textContent.trim() || "";
  
  // Full contest object
  const contest = {
    contestName,
    contestType,
    numProblems,
    problemHeaders,
    standings: filteredStandings,
    timestamp: new Date().toISOString()
  };

  console.log(contest); 
  
  // Save contest state to Firebase
  const contestDocRef = doc(db, 'contests', contestId);
  setDoc(contestDocRef, contest)
  .then(() => {
      console.log("Standings saved successfully")
      setTimeout(() => document.location.reload(), t); // refresh after T milliseconds
  }).catch((error) => console.error("Error saving standings:", error));

}

extractData(10000);
