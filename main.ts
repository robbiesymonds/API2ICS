import api2ics from "./api2ics.ts";

/**
 * Example of the API response we want to transform into an ICS file.
    {
        "results": [
            {
              "title": "Honours Research",
              "description": "Project",
              "location": "Online",
              "start": "07-03-2023 10:00",
              "end": "07-03-2023 13:00"
            },
            {
              "title": "Digital Microelectronics",
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
