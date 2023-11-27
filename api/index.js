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
        const dayText = daySpan ? daySpan.textContent : "Day not found";

        if (row.querySelectorAll(".day-item-volno").lenght === 0) {
          return {
            type: "volno",
          };
        } else {
          const dayItemHoverDivs = row.querySelectorAll(".day-item-hover");
          const dayItemsData = Array.from(dayItemHoverDivs).map((item) => {
            const dataDetail = item.getAttribute("data-detail");
            try {
              const parsedData = JSON.parse(dataDetail);

              if (parsedData.type == "atom") {
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
              } else if (parsedData.type == "removed") {
                return {
                  type: parsedData.type,
                };
              } else if (parsedData.type == "absent") {
                return {
                  type: parsedData.type,
                };
              } else {
                return {
                  error: "Unexpected lesson property returned.",
                };
              }
            } catch (error) {
              return "Invalid JSON";
            }
          });
          daysData.push({ [dayText]: dayItemsData });
        }
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

app.post("/api/fetch-groups", async (req, res) => {
  const classInput = req.body.class;

  try {
    const response = await fetch(
      `https://bakalari.spse.cz/bakaweb/Timetable/Public/Permanent/Class/${classInput}`
    );

    const html = await response.text();
    const { document } = new JSDOM(html).window;

    const timetableRowDivs = document.querySelectorAll(".bk-timetable-row");

    if (timetableRowDivs.length > 0) {
      const timetable = {};

      Array.from(timetableRowDivs).forEach((row) => {
        const dayItems = row.querySelectorAll(".day-item");
        const dayData = {};

        Array.from(dayItems).forEach((item) => {
          const dataDetail = item.getAttribute("data-detail");
          try {
            const parsedData = JSON.parse(dataDetail);

            if (parsedData.group) {
              const groupName = parsedData.group;
              const groupLetter = groupName.match(/[A-Z]+\d+/);
              if (groupLetter) {
                const letter = groupLetter[0];
                if (!dayData[letter]) {
                  dayData[letter] = [];
                }
                if (!dayData[letter].includes(groupName)) {
                  dayData[letter].push(groupName);
                }
              }
            }
          } catch (error) {
            // Handle JSON parse error
          }
        });

        timetable[row.getAttribute("data-day")] = dayData;
      });

      res.json({ timetable });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
