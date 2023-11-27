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
          const selectHTML = selectElement.innerHTML;
          setSelectOptionsHTML(selectHTML);
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
        console.log(uniqueGroups);

        const checkboxes = [];
        let selects = [];
        const option = [];

        uniqueGroups.forEach((group) => {
          const option = [];

          if (group === "DV") {
            checkboxes.push(
              <Col key="DV">
                <Form.Check id="DV" label="DV" />
              </Col>
            );
            console.log("DV");
          } else if (group === "CM") {
            checkboxes.push(
              <Col key="CM">
                <Form.Check id="CM" label="CM" />
              </Col>
            );
            console.log("CM");
          } else {
            const letter = (group.match(/[a-zA-Z]+/) || [""])[0];
            console.log(letter);

            const regex = new RegExp(`${letter}\\d`, "g");
            let selectsArray = [...groupsText.matchAll(regex)].map(
              (match) => match[0]
            );

            console.log(selectsArray);
            selectsArray = selectsArray.sort();

            selectsArray.forEach((groupFinal) => {
              option.push(<option value={groupFinal}>{groupFinal}</option>);
            });

            const selectId = letter;

            const push = (
              <Col key={selectId}>
                <Form.Select id={selectId}>{option}</Form.Select>
              </Col>
            );

            console.log(checkboxes);

            if (
              !selects.some(
                (existingSelect) => existingSelect.props.id === selectId
              )
            ) {
              console.log(push);
              selects.push(push);
            }
          }
        });

        selects = selects.filter(
          (select, index, array) =>
            array.findIndex((s) => s.key === select.key) === index
        );

        console.log(selects);

        setResult(data);
        setSelectElements(selects);
        setCheckboxElements(checkboxes);
      }

      setShowGroupsForm(true);
    } catch (error) {
      console.error(error);
    }
  };

  const filterTimetable = () => {
    if (selectElements.length === 0) {
      // No groups selected
      return;
    }
  
    // Get the selected groups
    const selectedGroups = selectElements.map((select) => select.props.id);
  
    // Filter the entire timetable data based on the selected groups
    const filteredTimetable = result.timetable.map((day) => {
      const filteredDay = Object.entries(day).reduce((acc, [key, lessons]) => {
        const filteredLessons = lessons.filter(
          (lesson) => lesson.group === null || selectedGroups.includes(lesson.group)
        );
        if (filteredLessons.length > 0) {
          acc[key] = filteredLessons;
        }
        return acc;
      }, {});
  
      return Object.keys(filteredDay).length > 0 ? filteredDay : null;
    });
  
    // Create a new JSON object with the filtered timetable
    const filteredResult = { timetable: filteredTimetable.filter(Boolean) };
  
    // Update the state with the filtered result
    setResult(filteredResult);
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
        <Row>
          {selectElements}
          {checkboxElements}
          <Col>
            <Button onClick={filterTimetable}>Filter Timetable</Button>
          </Col>
        </Row>
        <Row>
          <Col>
            <p>4.H má posraný skupiny sorry</p>
          </Col>
        </Row>
      </div>
      {result && <pre className="my-3">{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}

export default App;
