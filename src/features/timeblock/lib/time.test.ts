// Pin a DST-observing zone so the DST cases below are meaningful on any machine.
process.env.TZ = "America/New_York";

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  formatDuration,
  formatHour,
  formatMinutes,
  formatMonthDay,
  formatTimeRange,
  formatWeekRange,
  formatWeekday,
  isoWeekday,
  snap,
  startOfWeek,
  toDateKey,
  weekDates,
  weekdayLabel,
  weekdayOrder,
} from "./time.ts";

// Intl output contains narrow/thin spaces (U+202F, U+2009); compare on plain spaces.
const plain = (s: string) => s.replace(/\s+/g, " ");

test("snap rounds to the nearest 15 minutes", () => {
  assert.equal(snap(7), 0);
  assert.equal(snap(8), 15);
  assert.equal(snap(22), 15);
  assert.equal(snap(23), 30);
  assert.equal(snap(-20), -15);
});

test("toDateKey pads month and day", () => {
  assert.equal(toDateKey(new Date(2026, 0, 5)), "2026-01-05");
});

test("addDays crosses month and year boundaries", () => {
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("weeks containing a DST change still have 7 consecutive dates", () => {
  // 2026-03-08: clocks spring forward in New York. 2026-11-01: they fall back.
  assert.deepEqual(weekDates("2026-03-02"), [
    "2026-03-02",
    "2026-03-03",
    "2026-03-04",
    "2026-03-05",
    "2026-03-06",
    "2026-03-07",
    "2026-03-08",
  ]);
  assert.deepEqual(weekDates("2026-11-01"), [
    "2026-11-01",
    "2026-11-02",
    "2026-11-03",
    "2026-11-04",
    "2026-11-05",
    "2026-11-06",
    "2026-11-07",
  ]);
  assert.equal(addDays("2026-03-08", 1), "2026-03-09");
  assert.equal(addDays("2026-11-02", -1), "2026-11-01");
});

test("isoWeekday is Monday-based", () => {
  assert.equal(isoWeekday("2026-09-28"), 0); // Monday
  assert.equal(isoWeekday("2026-10-04"), 6); // Sunday
});

test("startOfWeek honors the week-start setting", () => {
  assert.equal(startOfWeek("2026-09-30", 1), "2026-09-28");
  assert.equal(startOfWeek("2026-10-04", 1), "2026-09-28"); // Sunday ends a Monday-start week
  assert.equal(startOfWeek("2026-10-04", 0), "2026-10-04");
  assert.equal(startOfWeek("2026-09-30", 0), "2026-09-27");
  assert.equal(startOfWeek("2026-09-28", 1), "2026-09-28");
});

test("weekdayOrder starts on Monday or Sunday", () => {
  assert.deepEqual(weekdayOrder(1), [0, 1, 2, 3, 4, 5, 6]);
  assert.deepEqual(weekdayOrder(0), [6, 0, 1, 2, 3, 4, 5]);
});

test("time formatters", () => {
  assert.equal(plain(formatMinutes(570, "en-US")), "9:30 AM");
  assert.equal(plain(formatMinutes(0, "en-US")), "12:00 AM");
  assert.equal(plain(formatMinutes(1440, "en-US")), "12:00 AM");
  assert.equal(plain(formatTimeRange(540, 600, "en-US")), "9:00 AM – 10:00 AM");
  assert.equal(plain(formatHour(7, "en-US")), "7 AM");
  assert.equal(plain(formatHour(0, "en-US")), "12 AM");
});

test("date formatters", () => {
  assert.equal(formatWeekday("2026-09-28", "en-US"), "Mon");
  assert.equal(weekdayLabel(0, "en-US"), "Mon");
  assert.equal(weekdayLabel(6, "en-US"), "Sun");
  assert.equal(formatMonthDay("2026-09-28", "en-US"), "Sep 28");
  assert.equal(
    plain(formatWeekRange(weekDates("2026-09-28"), "en-US")),
    "Sep 28 – Oct 4, 2026",
  );
  assert.equal(
    plain(formatWeekRange(weekDates("2026-12-28"), "en-US")),
    "Dec 28, 2026 – Jan 3, 2027",
  );
});

test("formatDuration shows hours", () => {
  assert.equal(formatDuration(0), "0h");
  assert.equal(formatDuration(90), "1.5h");
  assert.equal(formatDuration(75), "1.25h");
  assert.equal(formatDuration(600), "10h");
});
