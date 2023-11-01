import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [selectedClass, setSelectedClass] = useState("");
  const [result, setResult] = useState(null);
  const [selectOptionsHTML, setSelectOptionsHTML] = useState("");
  const [selectElements, setSelectElements] = useState([]);
  const [checkboxElements, setCheckboxElements] = useState([]);
  const [showGroupsForm, setShowGroupsForm] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [filteredData, setFilteredData] = useState(null);

  const handleSelectChange = (e) => {
    setSelectedClass(e.target.value);
  };

  const handleFilterClick = () => {
    if (result && result.timetable) {
      const filteredTimetable = result.timetable.map((day) => {
        if (Array.isArray(day)) {
          return day.filter((lesson) => selectedGroups.includes(lesson.group));
        } else {
          return day; // Return the day as is if it's not an array
        }
      });
  
      const filteredData = {
        timetable: filteredTimetable,
      };
  
      setFilteredData(filteredData);
    }
  };

  const handleCheckboxChange = (e) => {
    const groupName = e.target.value;
    if (e.target.checked) {
      setSelectedGroups((prevSelectedGroups) => [...prevSelectedGroups, groupName]);
    } else {
      setSelectedGroups((prevSelectedGroups) => prevSelectedGroups.filter((group) => group !== groupName));
    }
  };
  
  // ...
  
  {checkboxElements.map((checkbox) => (
    <div key={checkbox.key}>
      <input
        type="checkbox"
        id={checkbox.key}
        name={checkbox.key}
        value={checkbox.key}
        onChange={handleCheckboxChange}
        checked={selectedGroups.includes(checkbox.key)}
      />
      <label htmlFor={checkbox.key}>{checkbox.key}</label>
    </div>
  ))};
  
  useEffect(() => {
    const fetchClassOptions = async () => {
      try {
        const response = await fetch(
          "https://bakalari.spse.cz/bakaweb/Timetable/Public/"
        );
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");

        const selectElement = doc.getElementById("selectedClass");
        if (selectElement) {
          setSelectOptionsHTML(selectElement.innerHTML);
        }
      } catch (error) {
        console.error("Failed to fetch class options:", error);
      }
    };

    fetchClassOptions(); 
  }, []);

  const fetchTimetable = async () => {
    try {
      const response = await fetch(
        "http://localhost:3001/api/fetch-timetable",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ class: selectedClass }),
        }
      );

      if (response.ok) {
        const data = await response.json();
/*
        const uniqueGroups = new Set();
        const extraSubjects = new Set();

        for (const day of data.timetable) {
          for (const lessons of Object.values(day)) {
            for (const lesson of lessons) {
              const group = lesson.group;
              if (group) {
                uniqueGroups.add(group);
                if (group === "CM" || group === "DV") {
                  extraSubjects.add(group);
                }
              }
            }
          }
        }

        const groups = [...uniqueGroups];
        const extraSubjectsArray = [...extraSubjects];

        // Filter out "CM" and "DV"
        const filteredGroups = groups.filter(
          (group) => group !== "CM" && group !== "DV"
        );

        // Group by letters in ascending order
        const grouped = filteredGroups.reduce((result, group) => {
          const match = group.match(/([A-Z]+)/);
          if (match) {
            const letters = match[0];
            if (!result[letters]) {
              result[letters] = [];
            }
            result[letters].push(group);
          }
          return result;
        }, {});

        // Generate select elements and checkboxes
        const selectElements = [];
        const checkboxElements = [];

        for (const key in grouped) {
          const options = grouped[key].map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ));

          selectElements.push(
            <div key={key}>
              <label htmlFor={key}>{key}</label>
              <select id={key} name={key}>
                {options}
              </select>
            </div>
          );
        }

        for (const key of extraSubjectsArray) {
          checkboxElements.push(
            <div key={key}>
              <input
                type="checkbox"
                id={key}
                name={key}
                value={key}
                onChange={() => {
                  if (selectedGroups.includes(key)) {
                    setSelectedGroups((prevState) =>
                      prevState.filter((group) => group !== key)
                    );
                  } else {
                    setSelectedGroups((prevState) => [...prevState, key]);
                  }
                }}
              />
              <label htmlFor={key}>{key}</label>
            </div>
          );
        }

        setShowGroupsForm(true);
        setSelectElements(selectElements);
        setCheckboxElements(checkboxElements);
        setFilteredData(null); // Reset filtered data when fetching new timetable */
        setResult(data);
      } else {
        console.error("Failed to fetch data");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="container p-3">
      <h2 className="font-sans font-bold">Rozvrh Demo</h2>
      <div>
        <Row className="my-3">
          <Col>
            <Form.Select
              value={selectedClass}
              onChange={handleSelectChange}
              dangerouslySetInnerHTML={{ __html: selectOptionsHTML }}
            />
          </Col>
          <Col>
            <Button onClick={fetchTimetable}>Fetch Timetable</Button>
          </Col>
        </Row>
        {showGroupsForm && (
          <Row className="my-3">
            <Col>{selectElements}</Col>
            <Col>{checkboxElements}</Col>
          </Row>
        )}
        {showGroupsForm && (
          <Row className="my-3">
            <Col>
              <Button onClick={handleFilterClick}>Filter Timetable</Button>
            </Col>
          </Row>
        )}
      </div>
      {result && (
        <div>
          {filteredData ? (
            <div>
              <h3>Filtered Timetable:</h3>
              <pre>{JSON.stringify(filteredData, null, 2)}</pre>
            </div>
          ) : (
            <div>
              <h3>Complete Timetable:</h3>
              <pre>{JSON.stringify(result, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;