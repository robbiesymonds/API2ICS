import dayjs from "npm:dayjs";
import ora from "npm:ora";
import * as colors from "https://deno.land/std@0.178.0/fmt/colors.ts";
import { colorize } from "https://deno.land/x/json_colorize@0.1.0/mod.ts";

type CalendarFields = {
  summary: string;
  description?: string;
  location?: string;
  start: string;
  end: string;
};

interface RunOptions {
  url: string;
  method?: RequestInit["method"];
  headers?: RequestInit["headers"];
  filename?: string;
  transform?: (data: Record<string, string>) => CalendarFields;
  // deno-lint-ignore no-explicit-any
  filter?: (data: Record<string, any>) => Record<string, string>[];
  paginate?: (url: string, index: number) => string | null;
}

class api2ics {
  public static async run(options: RunOptions): Promise<void> {
    const { url, method, headers, filename, transform, filter, paginate } =
      options;

    console.log(
      colors.white(
        `Started ${colors.blue(colors.bold("API2ICS"))} ${colors.dim(
          `(v1.0.0)`
        )}`
      )
    );

    console.log(colors.italic(colors.dim("Starting API data collection...")));

    const results: Array<CalendarFields> = [];
    let s = ora(`Fetching data from API...`);

    let request_index = 0;
    let next = paginate ? paginate(url, request_index) : url;
    let data;

    while (next !== null) {
      if (paginate) {
        s.start(
          `Fetching data from API... ${colors.dim(
            `(page ${request_index + 1})`
          )}`
        );
      } else s.start();

      try {
        data = await fetch(next, { method, headers });
      } catch (_) {
        s = s.stopAndPersist();
        s.fail(
          `${colors.red(
            colors.bold("Unable to fetch data from API!")
          )} ${colors.dim(next)}`
        );
        Deno.exit();
      }

      try {
        if (!data) throw new Error("No data!");
        data = await data.json();
      } catch (e) {
        s = s.stopAndPersist();
        s.fail(
          `${colors.red(
            colors.bold("Unable to parse data from API!")
          )} ${colors.dim(e.message)}`
        );
        Deno.exit();
      }

      try {
        data = filter ? filter(data) : data;
      } catch (e) {
        s = s.stopAndPersist();
        s.fail(
          `${colors.red(
            colors.bold("Unable to filter data from API!")
          )} ${colors.dim(e.message)}`
        );

        console.log(colors.dim(colors.italic("Response from API:")));
        console.log(colorize(JSON.stringify(data, null, 2)));
        Deno.exit();
      }

      try {
        data = transform ? data.map(transform) : data;
      } catch (e) {
        s = s.stopAndPersist();
        s.fail(
          `${colors.red(
            colors.bold("Unable to transform data from API!")
          )} ${colors.dim(e.message)}`
        );
        Deno.exit();
      }

      results.push(...data);
      request_index++;

      // If there is no paginate function, we only make one request.
      if (!paginate) next = null;
      else next = paginate(url, request_index);
    }

    s = s.stopAndPersist();
    s.succeed(colors.green("Finished fetching data from API!"));

    try {
      data = this.convert(results);
    } catch (e) {
      s = s.stopAndPersist();
      s.fail(
        `${colors.red(
          colors.bold("Failed to convert data to ICS format!")
        )} ${colors.dim(e.message)}`
      );

      Deno.exit();
    }

    await this.download(data, filename ?? "download.ics");

    console.log(colors.green(colors.bold("Conversion complete! 🚀")));
    Deno.exit();
  }

  private static async download(data: string, filename: string): Promise<void> {
    let s = ora(`Generating '${filename}' file...`).start();
    try {
      await Deno.writeTextFile(filename, data);
      s = s.stopAndPersist();
      s.succeed(colors.green(`Generated '${filename}' file!`));
    } catch (_) {
      s = s.stopAndPersist();
      s.fail(`Unable to write to file!`);
      return;
    }
  }

  private static date(date: string): string {
    try {
      const t = dayjs(date);
      return `${t.format("YYYYMMDD")}T${t.format("HHmmss")}`;
    } catch (_) {
      ora().fail(
        colors.red(
          colors.bold(
            `Failed to parse date to ISO format! ${colors.dim(
              `Received: ${date}`
            )}`
          )
        )
      );
      Deno.exit();
    }
  }

  private static convert(data: CalendarFields[]): string {
    let s = ora(`Converting data to ICS format...`).start();

    // prettier-ignore
    const CALENDAR_START = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:api2ics\nCALSCALE:GREGORIAN\nX-WR-TIMEZONE:Australia/Adelaide\n`;
    const CALENDAR_END = "END:VCALENDAR";
    let result = CALENDAR_START;

    data.forEach((d) => {
      const s = `SUMMARY:${d.summary}`;
      const l = `LOCATION:${d.location ?? ""}`;
      const ds = `DESCRIPTION:${d.description ?? ""}`;
      const t = `DTSTART:${this.date(d.start)}\nDTEND:${this.date(d.end)}`;
      const event = `BEGIN:VEVENT\n${s}\n${l}\n${ds}\n${t}\nEND:VEVENT\n`;
      result += event;
    });

    result += CALENDAR_END;

    s = s.stopAndPersist();
    s.succeed(colors.green("Finished converting data to ICS format!"));

    return result;
  }
}

export default api2ics;
