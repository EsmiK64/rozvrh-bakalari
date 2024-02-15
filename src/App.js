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
  let announcementText = "";

  const handleSelectChange = (e) => {
    setSelectedClass(e.target.value);
  };

  useEffect(() => {
    const fetchClassOptions = async () => {
      try {
        const response = await fetch("http://localhost:3001/fetch-classes", { method: "POST" });
        if (!response.ok) {
          throw new Error(`Failed to fetch class options. Status: ${response.status}`);
        }
  
        const data = await response.text();
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
        let uniqueGroups = [...new Set(groups)];
        const groupsText = uniqueGroups.toString();

        const checkboxes = [];
        let selects = [];
        //const option = [];

        uniqueGroups.forEach((group) => {
          const option = [];
          const letter = (group.match(/[a-zA-Z]+/) || [""])[0];

          const regex = new RegExp(`${letter}\\d`, "g");
          let selectsArray = [...groupsText.matchAll(regex)].map(
            (match) => match[0]
          );

          selectsArray = selectsArray.sort();

          selectsArray.forEach((groupFinal) => {
            option.push(<option value={groupFinal}>{groupFinal}</option>);
          });

          if (option.length === 1) {
            checkboxes.push(
              <Col key={group}>
                <Form.Check id={group} label={group} name={group} />
              </Col>
            );
          } else {
            const selectId = letter;

            const push = (
              <Col key={selectId}>
                <label htmlFor={selectId}>Vyber skupinu...</label>
                <Form.Select id={selectId} defaultValue="" name={selectId} key={selectId}>
                  {option}
                </Form.Select>
              </Col>
            );

            if (
              !selects.some(
                (existingSelect) => existingSelect.props.id === selectId
              )
            ) {
              selects.push(push);
            }
          }
        });

        selects = selects.filter(
          (select, index, array) =>
            array.findIndex((s) => s.key === select.key) === index
        );

        setResult(data);
        setSelectElements(selects);
        setCheckboxElements(checkboxes);
      }

      setShowGroupsForm(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleFilterTimetable = (e) => {
    e.preventDefault();

    let selectedGroups = document.querySelectorAll(
      ".form select, .form input[type='checkbox']:checked"
    );
    selectedGroups = Array.from(selectedGroups).map((group) => group.value);

    const filteredTimetable = result.timetable.map((day) => {
      const filteredLessons = {};

      if (filteredLessons.length === 0) {
        return filteredLessons;
      } else {
        for (const [key, lessons] of Object.entries(day)) {
          const filteredGroupLessons = lessons.filter((lesson) => {
            const lessonGroup = lesson.group;

            return (
              !lessonGroup ||
              lessonGroup === null ||
              selectedGroups.includes(lessonGroup)
            );
          });

          if (filteredGroupLessons.length > 0) {
            filteredLessons[key] = filteredGroupLessons;
          } else {
            // If the day has no lessons, keep it as is
            filteredLessons[key] = lessons;
          }
        }

        announcementText = "Timetable filtered succesfully.";
        return filteredLessons;
      }
    });

    setResult({ timetable: filteredTimetable });
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
        {showGroupsForm &&
          <Form onSubmit={handleFilterTimetable}>
            <Row className="d-flex align-items-center form">
              {selectElements}
              {checkboxElements}
              <Col>
                <Button type="submit">Filter Timetable</Button>
              </Col>
            </Row>
          </Form>}
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

export default App;
