import React, { useState, useEffect } from "react";
import { Button, Form, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

function Teachers() {
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [result, setResult] = useState(null);
  const [selectOptionsHTML, setSelectOptionsHTML] = useState([]);
  let announcementText = "";

  const apiRoute = "http://localhost:3001";

  const handleSelectChange = (e) => {
    setSelectedTeacher(e.target.value);
  };

  useEffect(() => {
    const fetchClassOptions = async () => {
      try {
        const response = await fetch(`${apiRoute}/api/fetch-teachers`, { method: "POST" });

        if (!response.ok) {
          throw new Error(`Failed to fetch teachers options. Status: ${response.status}`);
        }

        const data = await response.json();

        setSelectOptionsHTML(data);
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchClassOptions();
  }, []);


  const fetchTimetable = async () => {
    try {
      const response = await fetch(
        `${apiRoute}/api/fetch-timetable-teachers`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ class: selectedTeacher }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        setResult(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTeacherEvents = async () => {
    try {
      const response = await fetch(
        `${apiRoute}/api/fetch-teacher-events`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ class: selectedTeacher }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        setResult(data);
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
            <Form.Select onChange={handleSelectChange}>
              {selectOptionsHTML.map((option, index) => (
                <option key={index} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col>
            <Button onClick={fetchTimetable}>Fetch Timetable</Button>
            <Button onClick={fetchTeacherEvents}>Fetch Events</Button>
          </Col>
        </Row>
        <Row>
          <Col>
            <p id={announcementText}></p>
          </Col>
        </Row>
      </div>
      {result && <pre className="my-3">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

export default Teachers;
