// @ts-check
import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

const config = {
  apiKey: "AIzaSyD09OPJuYtRzTi-Q5BiPR1Rl_DY-b8bEbQ",
  authDomain: "menstruation-calendar-25b64.firebaseapp.com",
  databaseURL: "https://menstruation-calendar-25b64.firebaseio.com",
  projectId: "menstruation-calendar-25b64",
  storageBucket: "menstruation-calendar-25b64.appspot.com",
  messagingSenderId: "157065999788"
};

firebase.initializeApp(config);
const db = firebase.firestore();
db.enablePersistence({ experimentalTabSynchronization: true }).then(() => {
  console.log("Woohoo! Multi-Tab Persistence!");
});
const googleAuthProvider = new firebase.auth.GoogleAuthProvider();

window["firebase"] = firebase;
window["db"] = db;
window["signOut"] = () => firebase.auth().signOut();

function isSameDay(d1 /*: DateTime*/, d2) {
  if (d1 instanceof Date) {
    return (
      d1.getDate() === d2.getDate() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getFullYear() === d2.getFullYear()
    );
  }
  return false;
}
function findKey(allDates, date) {
  return Object.keys(allDates).find(docKey =>
    isSameDay(allDates[docKey].date, date)
  );
}

function getDateColor(allDates, foundedKey) {
  return foundedKey ? allDates[foundedKey].color : "default";
}

function CenterHorizontaly({ children }) {
  return <div style={{ textAlign: "center" }}>{children}</div>;
}

function StateManagement({ userId /* always a userId*/ }) {
  const [allMenstruationDates, updateAllMenstrationDates] = useState(undefined);
  console.log("Do we have allMenstrationDates", allMenstruationDates);
  useEffect(
    () => {
      let unsubscribeCallback = db
        .collection("data")
        .where("user", "==", userId)
        .onSnapshot(querySnapshot => {
          let data = {};
          querySnapshot.forEach(doc => {
            data[doc.id] = doc.data();
            // convert stupid firebase timestamp to normal date
            data[doc.id].date = data[doc.id].date.toDate();
          });
          updateAllMenstrationDates(data);
        });
      return unsubscribeCallback ? unsubscribeCallback : () => null;
    },
    [userId]
  );
  function addMenstruationDay(date) {
    db
      .collection("data")
      .doc()
      .set({
        user: userId,
        date: date,
        color: "red"
      });
  }
  function removeMenstruationDay(date) {
    const foundedKey = findKey(allMenstruationDates, date);
    if (foundedKey) {
      db
        .collection("data")
        .doc(foundedKey)
        .delete()
        .catch(error => alert(error.message));
    } else {
      alert("Date not saved yet.");
    }
  }
  return allMenstruationDates ? (
    <div>
      <CalendarWidget
        {...{ allMenstruationDates, addMenstruationDay, removeMenstruationDay }}
      />
      <CenterHorizontaly>
        <UserControlMenu {...{ userId }} />
      </CenterHorizontaly>
    </div>
  ) : (
    <CenterHorizontaly> Loading data from server</CenterHorizontaly>
  );
}

function useForceUpdate() {
  const [, forceUpdate] = useState(0);
  return () => forceUpdate(x => x + 1);
}

function UserControlMenu() {
  const forceUpdate = useForceUpdate();
  const isAnonymous = firebase.auth().currentUser.isAnonymous;
  function logoutUser() {
    if (!isAnonymous) {
      firebase.auth().signOut();
    }
  }
  function linkAnonymousUserToGoogleAccount(e) {
    if (isAnonymous) {
      firebase
        .auth()
        .currentUser.linkWithPopup(googleAuthProvider)
        .then(forceUpdate)
        .catch(error => alert(error.message));
    }
  }
  return isAnonymous ? (
    <button onClick={linkAnonymousUserToGoogleAccount}>
      Login with gmail to sync your data
    </button>
  ) : (
    <button onClick={logoutUser}>Logout</button>
  );
}

function DatesTable({ allMenstruationDates, selectedDate }) {
  const [tableShown, updateTableShown] = useState(false);
  let sortedDates = [];

  if (allMenstruationDates) {
    sortedDates = Object.keys(allMenstruationDates)
      .map(key => allMenstruationDates[key].date)
      .sort((a, b) => a - b);
  }
  return (
    <React.Fragment>
      <div className="show-table-button">
        <button onClick={() => updateTableShown(!tableShown)}>{ tableShown ? "Hide Table" : "Show Table" }</button>
      </div>
      {tableShown &&
        <div className="dates-table">
          {sortedDates.map(item => (
            <div
              key={item.toDateString()}
              className={`date-item ${
                isSameDay(item, selectedDate) ? "selected" : ""
              }`}
            >
              {item.toDateString()}
            </div>
          ))}
        </div>
      }
    </React.Fragment>
  );
}

function CalendarWidget({
  allMenstruationDates,
  addMenstruationDay,
  removeMenstruationDay
}) {
  const [selectedDate, changeSelectedDay] = useState(new Date());
  return (
    <div className="App">
      <DatePicker
        inline
        selected={selectedDate}
        onChange={e => changeSelectedDay(e)}
        dayClassName={curentDate =>
          allMenstruationDates
            ? getDateColor(
                allMenstruationDates,
                findKey(allMenstruationDates, curentDate)
              )
            : "default"
        }
      />
      <DatesTable {...{ allMenstruationDates, selectedDate }} />
      <button onClick={() => addMenstruationDay(selectedDate)}>
        I am bleeding
      </button>
      <button onClick={() => removeMenstruationDay(selectedDate)}>
        Ops wrong date
      </button>
    </div>
  );
}

function NotLogedScreen({ userId /* null or map*/ }) {
  const loadingRef = useRef(false);
  function createNewUser() {
    if (!loadingRef.current) {
      loadingRef.current = true;
      firebase
        .auth()
        .signInAnonymously()
        .finally(() => (loadingRef.current = false));
    }
  }
  function loginExistingUser() {
    if (!loadingRef.current) {
      loadingRef.current = true;
      firebase
        .auth()
        .signInWithPopup(googleAuthProvider)
        .catch(error => alert(error.message))
        .finally(() => (loadingRef.current = false));
    }
  }
  const disableButtons = loadingRef.current === true;

  return userId ? (
    <StateManagement {...{ userId }} />
  ) : (
    <CenterHorizontaly>
      <button disabled={disableButtons} onClick={createNewUser}>
        Create new user for me
      </button>
      <button disabled={disableButtons} onClick={loginExistingUser}>
        I am existing user i want to log in
      </button>
    </CenterHorizontaly>
  );
}

function AuthUser() {
  const [userId, setUserId] = useState(undefined);
  useEffect(() => {
    firebase.auth().onAuthStateChanged(function(user) {
      console.log("On auth state change!!!!!", user);
      if (user) {
        // User is signed in.
        console.log("We have user", user.uid, user.isAnonymous);
        setUserId(user.uid);
      } else {
        setUserId(null);
        console.log("User is log out(or never loged in)");
      }
    });
  }, []);
  return userId === undefined ? (
    <CenterHorizontaly>Trying to sign in</CenterHorizontaly>
  ) : (
    <NotLogedScreen {...{ userId }} />
  );
}

export default AuthUser;
