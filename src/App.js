import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [selectedClass, setSelectedClass] = useState("");
  const [timetable, setTimetable] = useState(null);
  const [groups, setGroups] = useState(null);
  const [selectOptionsHTML, setSelectOptionsHTML] = useState("");

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
        "/api/fetch-timetable",
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
        setTimetable(data);
        console.log(data);
      } else {
        console.error("Failed to fetch timetable data");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch(
        "/api/fetch-groups",
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
        setGroups(data);
      } else {
        console.error("Failed to fetch groups");
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
          <Col>
            <Button onClick={fetchGroups}>Fetch Groups</Button>
          </Col>
        </Row>
      </div>
      <div>
        <div>
          <h3>Groups:</h3>
          <pre>{JSON.stringify(groups, null, 2)}</pre>
        </div>
        <div>
          <h3>Complete Timetable:</h3>
          <pre>{JSON.stringify(timetable, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}

export default App;