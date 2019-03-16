// @ts-check
import React, { useState, useEffect } from "react";
import "./App.css";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as kv from "idb-keyval";

const startDates = [
  [new Date("2019-03-05"), "red"],
  [new Date("2019-03-06"), "blue"],
  [new Date("2019-03-09"), "blue"]
];
function isSameDay(d1 /*: DateTime*/, d2) {
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
}
function getDateColor(allDates, date) {
  const founded = allDates.find(x => isSameDay(x[0], date));
  return founded ? founded[1] : "default";
}

function LoadFromIdb() {
  const [allDates, updateDates] = useState(undefined);
  function addToDates(date) {
    updateDates(x => [...x, [date, "red"]]);
  }
  useEffect(() => {
    if (allDates) kv.set("allDates", allDates);
  }, [allDates]);
  useEffect(() => {
    kv.get("allDates").then(allDates => {
      updateDates(allDates || []);
    });
  }, []);
  return allDates ? (
    <App {...{ allDates, addToDates }} />
  ) : (
    <div style={{ textAlign: "center" }}> Loading</div>
  );
}

function App({ allDates, addToDates }) {
  const [selectedDate, changeSelectedDay] = useState(new Date());

  return (
    <div className="App">
      <DatePicker
        inline
        selected={selectedDate}
        onChange={e => changeSelectedDay(e)}
        dayClassName={curentDate => getDateColor(allDates, curentDate)}
      />
      <button onClick={e => addToDates(selectedDate)}>I am bleeding</button>
    </div>
  );
}

export default LoadFromIdb;
