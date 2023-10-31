import express from 'express';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/fetch-timetable', async (req, res) => {
  const classInput = req.body.class;

  try {
    // Fetch HTML content from the Bakalari website
    const response = await fetch(`https://bakalari.spse.cz/bakaweb/Timetable/Public/Permanent/Class/${classInput}`);
    const html = await response.text();

    // Parse the HTML using jsdom
    const { document } = new JSDOM(html).window;

    // Extract data from the parsed HTML
    const timetableRowDivs = document.querySelectorAll('.bk-timetable-row');

    if (timetableRowDivs.length > 0) {
      const daysData = [];

      Array.from(timetableRowDivs).forEach((row) => {
        const daySpan = row.querySelector('.bk-day-day');
        const dayText = daySpan ? daySpan.textContent : 'Day not found';

        const dayItemHoverDivs = row.querySelectorAll('.day-item-hover');
        const dayItemsData = Array.from(dayItemHoverDivs).map((item) => {
          const dataDetail = item.getAttribute('data-detail');
          try {
            const parsedData = JSON.parse(dataDetail);

            // Split the "subjecttext" by "|" and trim spaces
            const subjectTextParts = parsedData.subjecttext.split('|').map(part => part.trim());
            const subject = subjectTextParts[0];
            const day = subjectTextParts[1];
            const lesson = subjectTextParts[2];

            return {
              subject,
              day,
              lesson,
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
          } catch (error) {
            return 'Invalid JSON';
          }
        });

        daysData.push({ [dayText]: dayItemsData });
      });

      // Send the data as JSON response
      res.json({ timetable: daysData });
    } else {
      res.status(404).json({ error: 'No divs with class "bk-timetable-row" found in the HTML.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});