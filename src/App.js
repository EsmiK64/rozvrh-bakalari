import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [selectedClass, setSelectedClass] = useState("");
  const [result, setResult] = useState(null);
  const [selectOptionsHTML, setSelectOptionsHTML] = useState("");
  const [selectElements, setSelectElements] = useState([]); // Declare selectElements
  const [showGroupsForm, setShowGroupsForm] = useState(false);
  const [checkboxes, setCheckboxes] = useState({});
  const [selectedGroup, setSelectedGroup] = useState("");

  const handleSelectChange = (e) => {
    setSelectedClass(e.target.value);
  };

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

      function separateArrays(inputArray) {
        const result = {};
      
        inputArray.forEach(item => {
          const key = item.match(/[A-Z]+/)[0];
          if (!result[key]) {
            result[key] = [];
          }
      
          result[key].push(item);
        });
      
        // Separate 'DV' and 'CM'
        result['special'] = [];
        inputArray.forEach(item => {
          if (item === 'DV' || item === 'CM') {
            result['special'].push(item);
          }
        });
      
        return result;
      }
    
  
      if (response.ok) {
        const data = await response.json();
        const selectGroup = [];
        const checkboxGroup = [];
        const groups = [];
  
        for (const day of data.timetable) {
          for (const lessons of Object.values(day)) {
            for (const lesson of lessons) {
              const group = lesson.group;
              if (group) {
                  groups.push(group);
                }
              }
            }
          }
        }
        const uniqueGroups = [...new Set(groups)];

        uniqueGroups = separateArrays(uniqueGroups);

        console.log(uniqueGroups);
  
        const selectElements = [];

        for (const key in uniqueGroups) {
          console.log(uniqueGroups[key]);
          if (uniqueSelectGroup.includes(uniqueGroups[key])) {
            const options = uniqueGroups[key].map((lesson) => (
              <option key={lesson.id} value={lesson.group}>
                {lesson.group}
              </option>
            ));
            selectElements.push(
              <Col key={key}>
                <Form.Select onChange={handleGroupSelectChange}>
                  <option value="" disabled>
                    Select a group
                  </option>
                  {options}
                </Form.Select>
              </Col>
            );
          } else {
            const checkbox = (
              <Col key={key}>
                <Form.Check
                  type="checkbox"
                  label={uniqueGroups[key]}
                  checked={checkboxes[key]}
                  onChange={() => handleCheckboxChange(key)}
                />
              </Col>
            );
            selectElements.push(checkbox);
          }
        }        
  
        setResult(data);
        setShowGroupsForm(true);
        setSelectElements(selectElements);
      } else {
        console.error("Failed to fetch data");
      }
    } catch (error) {
      console.error(error);
    }
  };  

  const handleGroupSelectChange = (e) => {
    setSelectedGroup(e.target.value);
  };

  const handleCheckboxChange = (group) => {
    setCheckboxes((prevCheckboxes) => ({
      ...prevCheckboxes,
      [group]: !prevCheckboxes[group],
    }));
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
            {selectElements}
            <Col>
              <Button onClick={fetchTimetable}>Fetch Selected Group</Button>
            </Col>
          </Row>
        )}
      </div>
      {result && <pre className="my-3">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

export default App;