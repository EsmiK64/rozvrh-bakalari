import express from "express";
import fetch from "node-fetch";
import { JSDOM } from "jsdom";
import cors from "cors";
const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post("/api/fetch-timetable", async (req, res) => {
  const classInput = req.body.class;

  try {
    const currentDate = new Date();
    const currentDay = currentDate.getDay();

    let response;

    if (currentDay === 0 || currentDay === 6) {
      response = await fetch(
        `https://bakalari.spse.cz/bakaweb/Timetable/Public/Next/Class/${classInput}`
      ); // weekend next week
    } else {
      response = await fetch(
        `https://bakalari.spse.cz/bakaweb/Timetable/Public/Actual/Class/${classInput}`
      ); // workday current week
    }

    const html = await response.text();

    const { document } = new JSDOM(html).window;

    const timetableRowDivs = document.querySelectorAll(".bk-timetable-row");

    if (timetableRowDivs.length > 0) {
      const daysData = [];

      Array.from(timetableRowDivs).forEach((row) => {
        const daySpan = row.querySelector(".bk-day-day");
        let dayText;
        
        if (daySpan) {
            switch (daySpan.textContent) {
                case "po":
                    dayText = "Pondělí";
                    break;
                case "út":
                    dayText = "Úterý";
                    break;
                case "st":
                    dayText = "Středa";
                    break;
                case "čt":
                    dayText = "Čtvrtek";
                    break;
                case "pá":
                    dayText = "Pátek";
                    break;
                default:
                    dayText = "Error: unexpected string in day.";
            }
        } else {
            dayText = "Error: unexpected string in day.";
        }
        
        const dayItemHoverDivs = row.querySelectorAll(".day-item-hover");
        const dayItemsData = Array.from(dayItemHoverDivs).map((item) => {
          const dataDetail = item.getAttribute("data-detail");
          try {
            const parsedData = JSON.parse(dataDetail);

            if (parsedData.type === "atom") {
              const subjectTextParts = parsedData.subjecttext
                .split("|")
                .map((part) => part.trim());
              const subject = subjectTextParts[0];
              const day = subjectTextParts[1];
              const lesson = subjectTextParts[2];

              const lessonRegex = /(\d+) \((\d+:\d+ - \d+:\d+)\)/;
              const lessonParts = lesson.match(lessonRegex);

              let lessonNumber;
              let lessonTime;

              if (lessonParts) {
                lessonNumber = lessonParts[1];
                lessonTime = lessonParts[2];
              }

              return {
                type: parsedData.type,
                subject,
                day,
                lessonNumber,
                lessonTime,
                teacher: parsedData.teacher,
                room: parsedData.room,
                group: parsedData.group,
                theme: parsedData.theme,
                notice: parsedData.notice,
                changeinfo: parsedData.changeinfo,
                homeworks: parsedData.homeworks,
                absencetext: parsedData.absencetext,
                hasAbsent: parsedData.hasAbsent,
                absentInfoText: parsedData.absentInfoText,
              };
            } else if (parsedData.type === "absent" || parsedData.type === "removed") {
              const subjectTextParts = parsedData.subjecttext
                .split("|")
                .map((part) => part.trim());
              const day = subjectTextParts[0];
              const lesson = subjectTextParts[1];

              const lessonRegex = /(\d+) \((\d+:\d+ - \d+:\d+)\)/;
              const lessonParts = lesson.match(lessonRegex);

              let lessonNumber;
              let lessonTime;

              if (lessonParts) {
                lessonNumber = lessonParts[1];
                lessonTime = lessonParts[2];
              }
              return {
                type: parsedData.type,
                day,
                lessonNumber,
                lessonTime,
                absencetext: parsedData.absentinfo,
                absentInfoText: parsedData.InfoAbsentName,
                removedInfo: parsedData.removedinfo,
              };
            } else {
              return "what the fuck bro";
            }
          } catch (error) {
            return "Invalid JSON" + error;
          }
        });
        daysData.push({ [dayText]: dayItemsData });
      });

      res.json({ timetable: daysData });
    } else {
      res.status(404).json({
        error: 'No divs with class "bk-timetable-row" found in the HTML.',
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.post("/api/fetch-classes", async (req, res) => {
  try {
    const response = await fetch('https://bakalari.spse.cz/bakaweb/Timetable/Public/');

    if (!response.ok) {
      throw new Error(`Failed to fetch classes. Status: ${response.status}`);
    }

    const html = await response.text();
    const { document } = new JSDOM(html).window;

    const selectOptions = Array.from(document.querySelectorAll("#selectedClass option")).map(option => ({
      value: option.value,
      label: option.textContent.trim(),
    }));

    res.status(200).json(selectOptions);
  } catch (error) {
    console.error('Error in /api/fetch-classes:', error);
    res.status(500).json({
      error: 'Failed to fetch class options.',
    });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
