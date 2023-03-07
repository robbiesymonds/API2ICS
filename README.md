# API2ICS

Easily convert any API's calendar endpoints into iCalendar formatted files.

## 🚀 Getting Started

1. Clone this repository to your local machine.
2. Install [Deno CLI](https://deno.land/) version 1.23.0 or higher.
3. Modify the `main.ts` file to accomdate your API's calendar endpoint. See the [examples](#📖-examples) below.

From within your project folder, run the program using the `deno task` command:

```bash
deno task start
```

## 📖 Examples

### Basic Usage
```ts
/**
 * Example of the API response we want to transform into an ICS file.
    {
        "results": [
            {
              "summary": "Honours Research",
              "description": "Project",
              "location": "Online",
              "start": "07-03-2023 10:00",
              "end": "07-03-2023 13:00"
            },
            {
              "summary": "Digital Microelectronics",
              "description": "Computer Exercise",
              "location": "Smith Hall - Room 236",
              "start": "08-03-2023 13:00",
              "end": "08-03-2023 15:00"
            }
        ]
    }
 */


api2ics.run({
  // The URL of the API endpoint.
  url: "https://api.example.com/calendar",

  // Optional function to filter/truncate the data from the API.
  // [i] While optional, pretty much always required as API's don't usually return raw arrays.
  filter: (data) => data.results,
});
```

> Note: We don't need to specify a `transform` function as the data is already in the correct format, that is, an array of objects with `summary`, `location`, `start`, `end`, and optionally `description` properties.


### Paginated API
It is common for calendar API's to be paginated where an offset is required to return the next set of results. The `paginate` function allows you to specify a function that will be called for each request. If the function returns `null`, the program will stop making new requests.

- In this example the API is paginated by 52 weeks at a time, using increments of 7 to specify the week. The `DAY_OFFSETS` array is used to generate the `offset` query parameter for each request.

- It is also common for APIs to require authentication using a token or cookie. The `headers` option allows you to specify any headers you want to send with each request.

```ts
/**
 * Example of the API response we want to transform into an ICS file.
    {
        "status": "success",
        "data": {
            "query": {
                "numrows": 2,
                "rows": [
                    {
                        "D.XLATLONGNAME": "Project",
                        "B.SUBJECT": "ENG",
                        "B.CATALOG_NBR": "4001A",
                        "B.DESCR": "Honours Research",
                        "F.DESCR": "",
                        "E.ROOM": "",
                        "E.DESCR": "",
                        "C.WEEKDAY_NAME": "Tuesday",
                        "DATE": "07 Mar 2023",
                        "C.MEETING_TIME_START": "10:00",
                        "C.MEETING_TIME_END": "13:00"
                    },
                    {
                        "D.XLATLONGNAME": "Computer Exercise",
                        "B.SUBJECT": "ELEC ENG",
                        "B.CATALOG_NBR": "4109",
                        "B.DESCR": "Digital Microelectronics",
                        "F.DESCR": "Smith Hall",
                        "E.ROOM": "236",
                        "E.DESCR": "CAT Suite",
                        "C.WEEKDAY_NAME": "Wednesday",
                        "DATE": "08 Mar 2023",
                        "C.MEETING_TIME_START": "13:00",
                        "C.MEETING_TIME_END": "15:00"
                    }
                ]
            }
        }
    }
 */

const DAY_OFFSETS = Array.from({ length: 52 }, (_, i) => i * 7);
const TOKEN = "my-token";

api2ics.run({
  // The URL of the API endpoint.
  url: "https://api.university.com/api/timetable",

  // Optional headers to send with the request.
  headers: {
    Authorization: `Bearer ${TOKEN}`,
  },

  // Optional filename for download.
  filename: "events.ics",

  // Optional function to filter/truncate the data from the API.
  // [i] Useful if the data you want is nested within the response.
  filter: (data) => data.data.query.rows,

  // Optional function to transform the data from the API.
  // [i] If you don't specify a transform function, we assume the data is in the correct format.
  transform: (data) => ({
    summary: `${data["B.DESCR"]} - ${data["D.XLATLONGNAME"]}`,
    location: `${data["F.DESCR"]} ${data["E.ROOM"]}`,
    start: `${data["DATE"]} ${data["START_TIME"].replace(".", ":")}`,
    end: `${data["DATE"]} ${data["END_TIME"].replace(".", ":")}`,
  }),

  // Optional function for handling multiple requests.
  paginate: (url, index) => {
    if (index >= DAY_OFFSETS.length) {
      return null;
    }

    const offset = DAY_OFFSETS[index];
    const newUrl = `${url}&offset=${offset}`;
    return newUrl;
  },
});
```