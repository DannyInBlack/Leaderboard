import app from './firebaseInit';
import { getFirestore, setDoc, doc } from 'firebase/firestore';

const db = getFirestore(app);

chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action === "saveData") {
    const { contestId, standings } = message.payload;

    try {
      // Save the entire standings data as a single document
      const contestDocRef = doc(db, 'contests', contestId);
      await setDoc(contestDocRef, { standings });

      console.log("Standings data saved successfully");
      sendResponse({ success: true });
    } catch (error) {
      console.error("Error saving user data:", error);
      sendResponse({ success: false, error: error.message });
    }

    return true; // Indicates async response
  }
});

